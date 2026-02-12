import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase environment variables");
    }

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Parse request
    const { gateway = "stripe", action, ...params } = await req.json();

    // Use service role to read payment settings (user doesn't have access)
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: settings, error: settingsError } = await adminClient
      .from("payment_settings")
      .select("*")
      .eq("gateway", gateway)
      .eq("enabled", true)
      .single();

    if (settingsError || !settings) {
      return new Response(
        JSON.stringify({ error: `Gateway "${gateway}" não está configurado ou habilitado.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!settings.secret_key) {
      return new Response(
        JSON.stringify({ error: `Chave secreta do ${gateway} não configurada.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Route to the appropriate gateway handler
    let result;
    switch (gateway) {
      case "stripe":
        result = await handleStripe(settings, action, params, userId);
        break;
      case "mercado_pago":
        result = await handleMercadoPago(settings, action, params, userId);
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Gateway "${gateway}" não suportado ainda.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Payment processing error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ─── Stripe Handler ───────────────────────────────────────────
async function handleStripe(
  settings: { secret_key: string; public_key: string | null },
  action: string,
  params: Record<string, unknown>,
  userId: string
) {
  const STRIPE_API = "https://api.stripe.com/v1";
  const headers = {
    Authorization: `Bearer ${settings.secret_key}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  switch (action) {
    case "create_checkout_session": {
      const body = new URLSearchParams({
        mode: (params.mode as string) || "subscription",
        "line_items[0][price]": params.price_id as string,
        "line_items[0][quantity]": "1",
        success_url: params.success_url as string,
        cancel_url: params.cancel_url as string,
        "metadata[user_id]": userId,
      });

      if (params.customer_email) {
        body.append("customer_email", params.customer_email as string);
      }

      const res = await fetch(`${STRIPE_API}/checkout/sessions`, {
        method: "POST",
        headers,
        body: body.toString(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Stripe error [${res.status}]: ${JSON.stringify(data)}`);
      return { url: data.url, session_id: data.id };
    }

    case "create_customer": {
      const body = new URLSearchParams({
        email: params.email as string,
        "metadata[user_id]": userId,
      });
      if (params.name) body.append("name", params.name as string);

      const res = await fetch(`${STRIPE_API}/customers`, {
        method: "POST",
        headers,
        body: body.toString(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Stripe error [${res.status}]: ${JSON.stringify(data)}`);
      return { customer_id: data.id };
    }

    case "list_prices": {
      const query = new URLSearchParams({ active: "true", limit: "100" });
      if (params.product_id) query.append("product", params.product_id as string);

      const res = await fetch(`${STRIPE_API}/prices?${query}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(`Stripe error [${res.status}]: ${JSON.stringify(data)}`);
      return { prices: data.data };
    }

    case "create_portal_session": {
      const body = new URLSearchParams({
        customer: params.customer_id as string,
        return_url: params.return_url as string,
      });

      const res = await fetch(`${STRIPE_API}/billing_portal/sessions`, {
        method: "POST",
        headers,
        body: body.toString(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Stripe error [${res.status}]: ${JSON.stringify(data)}`);
      return { url: data.url };
    }

    default:
      throw new Error(`Ação Stripe "${action}" não suportada.`);
  }
}

// ─── Mercado Pago Handler ─────────────────────────────────────
async function handleMercadoPago(
  settings: { secret_key: string },
  action: string,
  params: Record<string, unknown>,
  userId: string
) {
  const MP_API = "https://api.mercadopago.com";
  const headers = {
    Authorization: `Bearer ${settings.secret_key}`,
    "Content-Type": "application/json",
  };

  switch (action) {
    case "create_preference": {
      const body = {
        items: params.items,
        payer: params.payer,
        back_urls: params.back_urls,
        auto_return: "approved",
        metadata: { user_id: userId },
      };

      const res = await fetch(`${MP_API}/checkout/preferences`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`MercadoPago error [${res.status}]: ${JSON.stringify(data)}`);
      return { init_point: data.init_point, preference_id: data.id };
    }

    case "create_pix": {
      const body = {
        transaction_amount: params.amount,
        description: params.description,
        payment_method_id: "pix",
        payer: params.payer,
        metadata: { user_id: userId },
      };

      const res = await fetch(`${MP_API}/v1/payments`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`MercadoPago error [${res.status}]: ${JSON.stringify(data)}`);
      return {
        payment_id: data.id,
        status: data.status,
        qr_code: data.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: data.point_of_interaction?.transaction_data?.qr_code_base64,
        ticket_url: data.point_of_interaction?.transaction_data?.ticket_url,
      };
    }

    default:
      throw new Error(`Ação MercadoPago "${action}" não suportada.`);
  }
}
