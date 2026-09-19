// Follow Deno and Supabase Edge Functions standard conventions
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

// CORS headers allowing requests from the frontend client
export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, Authorization, X-Client-Info, Apikey, Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

Deno.serve(async (req: Request) => {
  // 1. Handle CORS Preflight request with HTTP 200 OK and CORS headers
  if (req.method === "OPTIONS") {
    const requestedHeaders = req.headers.get("Access-Control-Request-Headers");
    const preflightHeaders = {
      ...corsHeaders,
      ...(requestedHeaders ? { "Access-Control-Allow-Headers": requestedHeaders } : {}),
    };
    return new Response("ok", {
      status: 200,
      headers: preflightHeaders,
    });
  }

  // Ensure request method is POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Método não permitido. Utilize POST." }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // 2. Parse request JSON body
    let body: { amount?: unknown; payer_email?: unknown };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Formato de requisição inválido (JSON esperado)." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { amount, payer_email } = body ?? {};

    // 3. Strict Input Validation
    if (typeof amount !== "number" || isNaN(amount)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "O campo 'amount' é obrigatório e deve ser um valor numérico.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (amount <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "O valor da contribuição deve ser maior que zero.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (amount > 10000) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "O valor máximo permitido por transação é de R$ 10.000,00.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Format transaction amount with 2 decimal places
    const parsedAmount = Number(amount.toFixed(2));

    // Optional payer_email formatting/sanitization
    let sanitizedPayerEmail: string | undefined = undefined;
    if (
      typeof payer_email === "string" &&
      payer_email.trim().length > 0 &&
      payer_email.includes("@")
    ) {
      sanitizedPayerEmail = payer_email.trim().toLowerCase();
    }

    // 4. Retrieve Mercado Pago Access Token from environment
    const mercadopagoAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mercadopagoAccessToken) {
      console.error("Configuração ausente: MERCADOPAGO_ACCESS_TOKEN não encontrado.");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Serviço de pagamento temporariamente indisponível. Contate o administrador.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 5. Generate unique UUID for Idempotency
    const idempotencyKey = crypto.randomUUID();

    // 6. Build Mercado Pago PIX payment request body
    // Mercado Pago PIX API requires payer.email; when not supplied by user, use shelter donor fallback
    const payerEmail = sanitizedPayerEmail || "doador@abrigodonanair.org.br";

    const mpPayload = {
      transaction_amount: parsedAmount,
      description: "Contribuição para animais resgatados",
      payment_method_id: "pix",
      payer: {
        email: payerEmail,
      },
    };

    // 7. Make request to Mercado Pago API
    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mercadopagoAccessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(mpPayload),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error(
        "Mercado Pago API error:",
        mpResponse.status,
        mpData?.message || mpData?.error || "Unknown error"
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: "Não foi possível gerar a cobrança PIX no momento. Tente novamente em alguns instantes.",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 8. Extract PIX transaction details safely
    const paymentId = mpData?.id ? String(mpData.id) : null;
    const status = mpData?.status ?? "pending";
    const statusDetail = mpData?.status_detail ?? null;
    const transactionData = mpData?.point_of_interaction?.transaction_data;
    const qrCode = transactionData?.qr_code ?? null;
    const qrCodeBase64 = transactionData?.qr_code_base64 ?? null;
    const ticketUrl = transactionData?.ticket_url ?? null;

    // 9. Save payment record into Supabase public.donation_payments using service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (supabaseUrl && supabaseServiceRoleKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });

        const { error: dbError } = await supabase.from("donation_payments").insert({
          amount: parsedAmount,
          status: "pending",
          mercadopago_payment_id: paymentId,
          mercadopago_status: status,
          description: "Contribuição para animais resgatados",
          payer_email: sanitizedPayerEmail ?? null,
          qr_code: qrCode,
          qr_code_base64: qrCodeBase64,
          ticket_url: ticketUrl,
        });

        if (dbError) {
          console.error("Erro ao registrar em public.donation_payments:", dbError.message);
        }
      } catch (dbErr) {
        console.error("Exceção ao conectar com Supabase DB:", dbErr);
      }
    } else {
      console.warn("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos na Edge Function.");
    }

    // 10. Return clean and safe JSON response to the frontend
    return new Response(
      JSON.stringify({
        success: true,
        payment_id: paymentId,
        status: status,
        qr_code: qrCode,
        qr_code_base64: qrCodeBase64,
        ticket_url: ticketUrl,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    console.error("Erro inesperado na Edge Function create-pix:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Ocorreu um erro interno ao processar a solicitação. Tente novamente mais tarde.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
