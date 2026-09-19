import express from 'express';
import path from 'path';
import { randomUUID } from 'crypto';
import 'dotenv/config';

const app = express();
const PORT = 3000;

app.use(express.json());

// Endpoint de verificação da configuração (sem vazar o segredo)
app.get('/api/pix/status-config', (req, res) => {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  res.json({
    configured: Boolean(token && token.length > 5),
    isTestToken: Boolean(token && token.startsWith('TEST-')),
  });
});

// Helper para obter dados do usuário do Mercado Pago associado ao Access Token
async function getMercadoPagoUserInfo(token: string) {
  try {
    const res = await fetch('https://api.mercadopago.com/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('[Diagnostic getMercadoPagoUserInfo error]:', err);
  }
  return null;
}

// Endpoint temporário de diagnóstico solicitado: GET /api/mp-user
app.get('/api/mp-user', async (req, res) => {
  try {
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
    if (!token) {
      return res.status(400).json({
        error: 'missing_token',
        message: 'MERCADO_PAGO_ACCESS_TOKEN não está configurado nas variáveis de ambiente.',
      });
    }

    const mpResponse = await fetch('https://api.mercadopago.com/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const mpData: any = await mpResponse.json();

    // Garantir que o Access Token NUNCA seja exposto no JSON
    if (mpData && typeof mpData === 'object') {
      delete mpData.access_token;
      delete mpData.refresh_token;
      delete mpData.client_secret;
    }

    return res.status(mpResponse.status).json(mpData);
  } catch (error: any) {
    return res.status(500).json({
      error: 'internal_error',
      message: error?.message || 'Erro ao consultar https://api.mercadopago.com/users/me',
    });
  }
});

app.get('/api/pix/diagnostic/me', (req, res, next) => (app._router.handle({ ...req, url: '/api/mp-user' }, res, next)));

// Endpoint para criar cobrança Pix no Mercado Pago via Payments API (/v1/payments)
app.post('/api/pix/create', async (req, res) => {
  try {
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
    if (!token) {
      return res.status(400).json({
        status: 400,
        error: 'missing_token',
        message: 'MERCADO_PAGO_ACCESS_TOKEN não está configurado nas variáveis de ambiente/secret.',
        cause: ['Defina a variável secreta MERCADO_PAGO_ACCESS_TOKEN no menu Settings > Secrets.'],
      });
    }

    const { amount, transaction_amount, external_reference } = req.body || {};
    const rawAmount = transaction_amount !== undefined ? transaction_amount : amount;
    const numericAmount = Number(rawAmount);
    const finalAmount = (!isNaN(numericAmount) && numericAmount > 0)
      ? Number(numericAmount.toFixed(2))
      : 10.00;

    // E-mail do doador informado pelo usuário (NÃO usar usuário de teste fixo)
    const donorEmail = (
      req.body?.payer?.email ||
      req.body?.payer_email ||
      req.body?.email
    )?.trim();

    if (!donorEmail || !donorEmail.includes('@')) {
      return res.status(400).json({
        status: 400,
        error: 'missing_payer_email',
        message: 'Por favor, informe um e-mail válido para o doador (payer.email).',
      });
    }

    // Gerar chave de idempotência UUID V4 única para cada cobrança
    const idempotencyKey = randomUUID();

    // Body exato para o Abrigo Viva Patas via /v1/payments
    const payload: any = {
      transaction_amount: finalAmount,
      description: 'Doação - Abrigo Viva Patas',
      payment_method_id: 'pix',
      payer: {
        email: donorEmail,
      },
    };

    if (external_reference?.trim()) {
      payload.external_reference = external_reference.trim();
    }

    // Obter informações do recebedor (dono do token) para logging detalhado
    const receiverInfo = await getMercadoPagoUserInfo(token);

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(payload),
    });

    const mpData: any = await mpResponse.json();

    // Log estrito no backend conforme solicitado:
    // * ID do usuário Mercado Pago associado ao Access Token, se disponível
    // * email do payer utilizado
    // * endpoint utilizado
    // * status HTTP
    // * resposta JSON do Mercado Pago
    console.log('=== [MERCADO PAGO BACKEND LOG] ===');
    console.log('ID do usuário Mercado Pago associado ao Access Token:', receiverInfo?.id ? receiverInfo.id : 'Não disponível');
    console.log('Email do payer utilizado:', payload.payer?.email);
    console.log('Endpoint utilizado: POST https://api.mercadopago.com/v1/payments');
    console.log('Status HTTP:', mpResponse.status);
    console.log('Resposta JSON do Mercado Pago:', JSON.stringify(mpData));
    if (receiverInfo) {
      console.log('Recebedor Detalhes -> Nickname:', receiverInfo.nickname, '| Email:', receiverInfo.email, '| Site:', receiverInfo.site_id, '| Country:', receiverInfo.country_id);
    }
    console.log('===================================');

    if (!mpResponse.ok) {
      return res.status(mpResponse.status).json({
        status: mpResponse.status,
        error: mpData?.message || mpData?.error || 'Erro na cobrança Pix do Mercado Pago',
        message: mpData?.message || mpData?.error || 'Erro ao gerar Pix no Mercado Pago.',
        cause: mpData?.cause || mpData?.errors || null,
        raw: mpData,
      });
    }

    // Retornar ao frontend os campos padronizados:
    // id, status, status_detail, transaction_amount, point_of_interaction.transaction_data.{qr_code, qr_code_base64, ticket_url}
    const result = {
      id: mpData.id,
      status: mpData.status,
      status_detail: mpData.status_detail,
      transaction_amount: mpData.transaction_amount,
      point_of_interaction: {
        transaction_data: {
          qr_code: mpData.point_of_interaction?.transaction_data?.qr_code || null,
          qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64 || null,
          ticket_url: mpData.point_of_interaction?.transaction_data?.ticket_url || null,
        },
      },
      raw: mpData,
    };

    return res.status(201).json(result);
  } catch (error: any) {
    console.error('[Payments Create Handler Error]:', error?.message || error);
    return res.status(500).json({
      status: 500,
      error: 'internal_server_error',
      message: 'Erro interno ao se comunicar com a API /v1/payments do Mercado Pago.',
      cause: [error?.message || 'Erro de conexão'],
    });
  }
});

// Endpoint para consultar status do Pagamento pelo ID: GET https://api.mercadopago.com/v1/payments/{PAYMENT_ID}
app.get('/api/pix/payments/:paymentId', async (req, res) => {
  try {
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
    if (!token) {
      return res.status(400).json({
        status: 400,
        error: 'missing_token',
        message: 'MERCADO_PAGO_ACCESS_TOKEN não está configurado.',
      });
    }

    const { paymentId } = req.params;
    if (!paymentId || paymentId.trim() === '') {
      return res.status(400).json({
        status: 400,
        error: 'missing_payment_id',
        message: 'ID do pagamento não informado.',
      });
    }

    const exists = Boolean(token);
    const first8 = token.substring(0, 8);
    console.log(`[Mercado Pago Query /v1/payments/${paymentId}] MERCADO_PAGO_ACCESS_TOKEN exists: ${exists} | first 8 chars: ${first8}`);

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId.trim())}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const mpData: any = await mpResponse.json();
    return res.status(mpResponse.status).json(mpData);
  } catch (error: any) {
    console.error('[Payments Query Handler Error]:', error?.message || error);
    return res.status(500).json({
      status: 500,
      error: 'internal_server_error',
      message: 'Erro interno ao consultar pagamento no Mercado Pago.',
      cause: [error?.message || 'Erro desconhecido'],
    });
  }
});

// Suporte para consulta pelo ID: GET /api/pix/:id
app.get('/api/pix/:id', async (req, res) => {
  const { id } = req.params;
  req.url = `/api/pix/payments/${encodeURIComponent(id)}`;
  app.handle(req, res);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Vite Middleware para desenvolvimento / Produção estática
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error('Failed to start server:', err);
});
