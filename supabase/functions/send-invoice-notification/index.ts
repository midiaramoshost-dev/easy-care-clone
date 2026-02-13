import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { invoice_id, channels } = await req.json();
    // channels: { email: boolean, whatsapp: boolean }

    if (!invoice_id || !channels) {
      return new Response(JSON.stringify({ error: "invoice_id and channels required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch invoice
    const { data: invoice, error: invError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoice_id)
      .single();

    if (invError || !invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch user profile and auth email
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", invoice.user_id)
      .single();

    const { data: { user: invoiceUser } } = await supabase.auth.admin.getUserById(invoice.user_id);
    const userEmail = invoiceUser?.email;
    const userPhone = profile?.phone;
    const userName = profile?.full_name || "Cliente";

    const results: Record<string, any> = {};
    const amount = Number(invoice.amount).toFixed(2);
    const dueDate = new Date(invoice.due_date).toLocaleDateString("pt-BR");

    // Send Email via Resend
    if (channels.email) {
      const { data: resendConfig } = await supabase
        .from("notification_settings")
        .select("api_key, enabled")
        .eq("service", "resend")
        .single();

      if (!resendConfig?.enabled || !resendConfig?.api_key) {
        results.email = { success: false, error: "Resend não configurado ou desabilitado" };
      } else if (!userEmail) {
        results.email = { success: false, error: "Usuário sem email cadastrado" };
      } else {
        try {
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendConfig.api_key}`,
            },
            body: JSON.stringify({
              from: "CuidadoFácil <noreply@cuidadofacil.com.br>",
              to: [userEmail],
              subject: `Cobrança - R$ ${amount} - Vencimento ${dueDate}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #2563eb;">CuidadoFácil - Cobrança</h2>
                  <p>Olá, <strong>${userName}</strong>!</p>
                  <p>Segue sua fatura:</p>
                  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 16px 0;">
                    <p><strong>Valor:</strong> R$ ${amount}</p>
                    <p><strong>Vencimento:</strong> ${dueDate}</p>
                    ${invoice.description ? `<p><strong>Descrição:</strong> ${invoice.description}</p>` : ""}
                    ${invoice.reference_month ? `<p><strong>Referência:</strong> ${invoice.reference_month}</p>` : ""}
                  </div>
                  <p>Em caso de dúvidas, entre em contato com nosso suporte.</p>
                  <p style="color: #6b7280; font-size: 12px;">Este é um email automático, não responda.</p>
                </div>
              `,
            }),
          });

          if (emailRes.ok) {
            results.email = { success: true };
          } else {
            const errBody = await emailRes.text();
            results.email = { success: false, error: errBody };
          }
        } catch (e: any) {
          results.email = { success: false, error: e.message };
        }
      }
    }

    // Send WhatsApp via Z-API
    if (channels.whatsapp) {
      const { data: zapiConfig } = await supabase
        .from("notification_settings")
        .select("api_key, instance_id, enabled")
        .eq("service", "zapi")
        .single();

      if (!zapiConfig?.enabled || !zapiConfig?.api_key || !zapiConfig?.instance_id) {
        results.whatsapp = { success: false, error: "Z-API não configurado ou desabilitado" };
      } else if (!userPhone) {
        results.whatsapp = { success: false, error: "Usuário sem telefone cadastrado" };
      } else {
        try {
          const phone = userPhone.replace(/\D/g, "");
          const message = `*CuidadoFácil - Cobrança*\n\nOlá, ${userName}!\n\n📄 *Fatura*\n💰 Valor: R$ ${amount}\n📅 Vencimento: ${dueDate}${invoice.description ? `\n📝 ${invoice.description}` : ""}${invoice.reference_month ? `\n📆 Ref: ${invoice.reference_month}` : ""}\n\nEm caso de dúvidas, entre em contato.`;

          const zapiRes = await fetch(
            `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.api_key}/send-text`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                phone: phone,
                message: message,
              }),
            }
          );

          if (zapiRes.ok) {
            results.whatsapp = { success: true };
          } else {
            const errBody = await zapiRes.text();
            results.whatsapp = { success: false, error: errBody };
          }
        } catch (e: any) {
          results.whatsapp = { success: false, error: e.message };
        }
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
