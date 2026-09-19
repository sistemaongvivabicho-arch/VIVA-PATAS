import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig, SUPABASE_CONFIG_EVENT } from './config';

// Singleton Supabase client for the browser
let supabaseInstance: SupabaseClient | null = null;
let currentConfigKey = '';

/**
 * Resets the active Supabase client instance so new credentials take effect immediately.
 */
export function resetSupabaseClient(): void {
  supabaseInstance = null;
  currentConfigKey = '';
}

// Automatically listen for configuration changes
if (typeof window !== 'undefined') {
  window.addEventListener(SUPABASE_CONFIG_EVENT, () => {
    resetSupabaseClient();
  });
}

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();

  if (!config.isConfigured || !config.url || !config.publishableKey) {
    resetSupabaseClient();
    return null;
  }

  const newKey = `${config.url}::${config.publishableKey}`;

  if (supabaseInstance && currentConfigKey === newKey) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(config.url, config.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    currentConfigKey = newKey;
    return supabaseInstance;
  } catch (err) {
    console.error('Erro ao inicializar cliente Supabase:', err);
    return null;
  }
}

export interface CreatePixResponse {
  success: boolean;
  payment_id?: string;
  status?: string;
  qr_code?: string;
  qr_code_base64?: string;
  ticket_url?: string;
  error?: string;
}

export interface CheckStatusResponse {
  success: boolean;
  status?: string;
  error?: string;
}

/**
 * Calls the Supabase Edge Function `create-pix`
 * Validates amount, avoids exposing sensitive credentials, and formats the response.
 */
export async function createPixPayment(
  amount: number,
  payerEmail?: string
): Promise<CreatePixResponse> {
  // Validate input
  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    return {
      success: false,
      error: 'Valor de doação inválido. Escolha um valor maior que zero.',
    };
  }

  if (amount > 10000) {
    return {
      success: false,
      error: 'O valor máximo permitido é de R$ 10.000,00.',
    };
  }

  const payload: { amount: number; payer_email?: string } = {
    amount: Number(amount.toFixed(2)),
  };

  if (payerEmail && payerEmail.trim().includes('@')) {
    payload.payer_email = payerEmail.trim();
  }

  const client = getSupabaseClient();

  try {
    // 1. Try invoking via Supabase client if configured
    if (client) {
      const { data, error } = await client.functions.invoke<CreatePixResponse>('create-pix', {
        body: payload,
      });

      if (error) {
        console.error('Erro ao invocar create-pix no Supabase:', error);

        // In supabase-js, if Edge Function returns non-2xx (like 400), error context may contain the JSON response
        let backendMessage: string | null = null;
        try {
          if ('context' in error && error.context && typeof error.context.json === 'function') {
            const errJson = await error.context.json();
            if (errJson?.error) backendMessage = errJson.error;
          }
        } catch {
          // Ignore context read error
        }

        return {
          success: false,
          error: backendMessage || error.message || 'Não foi possível gerar o PIX agora. Tente novamente.',
        };
      }

      if (data && data.success) {
        return data;
      }

      if (data && data.error) {
        return {
          success: false,
          error: data.error,
        };
      }
    }

    const config = getSupabaseConfig();

    // 2. Direct fallback to URL if Supabase URL is available
    if (config.url) {
      const endpoint = `${config.url.replace(/\/+$/, '')}/functions/v1/create-pix`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.publishableKey ? { apikey: config.publishableKey, Authorization: `Bearer ${config.publishableKey}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data: CreatePixResponse = await res.json();
      if (res.ok && data?.success) {
        return data;
      }

      return {
        success: false,
        error: data?.error || 'Não foi possível gerar o PIX agora. Tente novamente.',
      };
    }

    // 3. Fallback to Express backend /api/pix/create
    try {
      const res = await fetch('/api/pix/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_amount: amount,
          amount,
          payer: payerEmail ? { email: payerEmail } : undefined,
          payer_email: payerEmail || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data?.point_of_interaction?.transaction_data?.qr_code) {
        return {
          success: true,
          qr_code: data.point_of_interaction.transaction_data.qr_code,
          qr_code_base64: data.point_of_interaction.transaction_data.qr_code_base64,
          payment_id: String(data.id || ''),
          ticket_url: data.point_of_interaction.transaction_data.ticket_url,
        };
      }
      if (!res.ok) {
        return {
          success: false,
          error: data.message || data.error || 'Falha ao gerar cobrança no Mercado Pago.',
        };
      }
    } catch {
      // Ignore and proceed to message
    }

    // If neither Supabase client nor backend returned PIX
    return {
      success: false,
      error: 'Não foi possível gerar a cobrança Pix. Verifique a configuração do MERCADO_PAGO_ACCESS_TOKEN.',
    };
  } catch (err) {
    console.error('Exceção ao chamar create-pix:', err);
    return {
      success: false,
      error: 'Não foi possível gerar o PIX agora. Tente novamente.',
    };
  }
}

/**
 * Periodically checks the PIX payment status by payment_id
 */
export async function checkPixStatus(paymentId: string): Promise<CheckStatusResponse> {
  if (!paymentId) return { success: false, error: 'ID de pagamento ausente' };

  const client = getSupabaseClient();

  try {
    // 1. Try checking via check-pix-status Edge function if deployed
    if (client) {
      const { data } = await client.functions.invoke<{
        success: boolean;
        status: string;
      }>('check-pix-status', {
        body: { payment_id: paymentId },
      });

      if (data?.status) {
        return { success: true, status: data.status };
      }
    }

    // 2. Query donation_payments table in Supabase
    if (client) {
      const { data: dbData } = await client
        .from('donation_payments')
        .select('status, mercadopago_status')
        .eq('mercadopago_payment_id', String(paymentId))
        .maybeSingle();

      if (dbData) {
        const currentStatus = dbData.status === 'approved' || dbData.mercadopago_status === 'approved'
          ? 'approved'
          : dbData.mercadopago_status || dbData.status || 'pending';
        return { success: true, status: currentStatus };
      }
    }

    // 3. Fallback to Express backend GET /api/pix/payments/:id
    try {
      const res = await fetch(`/api/pix/payments/${encodeURIComponent(paymentId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.status) {
          return { success: true, status: data.status };
        }
      }
    } catch {
      // Ignore fallback error
    }

    return { success: true, status: 'pending' };
  } catch (err) {
    console.warn('Erro silencioso ao verificar status do PIX:', err);
    return { success: false, status: 'pending' };
  }
}
