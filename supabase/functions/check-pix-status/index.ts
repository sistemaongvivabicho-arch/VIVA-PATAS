// Supabase Edge Function to check payment status directly with Mercado Pago
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, Authorization, X-Client-Info, Apikey, Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    const requestedHeaders = req.headers.get("Access-Control-Request-Headers");
    const preflightHeaders = {
      ...corsHeaders,
      ...(requestedHeaders ? { "Access-Control-Allow-Headers": requestedHeaders } : {}),
    };
    return new Response("ok", { status: 200, headers: preflightHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Método não permitido." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { payment_id } = await req.json().catch(() => ({}));

    if (!payment_id) {
      return new Response(
        JSON.stringify({ success: false, error: "payment_id é obrigatório." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mercadopagoAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mercadopagoAccessToken) {
      return new Response(
        JSON.stringify({ success: false, error: "Configuração do gateway indisponível." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Query Mercado Pago API for status
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${mercadopagoAccessToken}`,
      },
    });

    const mpData = await mpRes.json();

    if (!mpRes.ok) {
      return new Response(
        JSON.stringify({ success: false, error: "Não foi possível consultar o status do pagamento." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const status = mpData.status; // 'pending' | 'approved' | 'rejected' | 'cancelled'
    const statusDetail = mpData.status_detail;

    // Update public.donation_payments if Supabase service role is available
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (supabaseUrl && supabaseServiceRoleKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
        await supabase
          .from("donation_payments")
          .update({
            status: status === "approved" ? "approved" : "pending",
            mercadopago_status: status,
          })
          .eq("mercadopago_payment_id", String(payment_id));
      } catch (dbErr) {
        console.error("Erro ao atualizar status no banco:", dbErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: String(payment_id),
        status: status,
        status_detail: statusDetail,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Erro ao verificar status:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno ao verificar status." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
