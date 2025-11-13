// @ts-nocheck
// Deno Edge Function: TypeScript in the IDE may not resolve remote imports or Deno globals.
// ts-nocheck avoids false diagnostics while preserving runtime behavior on Supabase.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-requested-with",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

interface ChatMessageRequest {
  ticketId: string;
  customerName: string;
  customerPhone: string;
  subject: string;
  message: string;
  pageUrl?: string;
  attachmentBase64?: string;
  attachmentFileName?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    // Explicit OK status fixes CORS preflight failures in some browsers
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const evolutionBaseUrl = Deno.env.get("EVOLUTION_BASE_URL")?.replace(/\/+$/, ""); // Remove trailing slashes
    const evolutionInstance = Deno.env.get("EVOLUTION_INSTANCE");
    const evolutionToken = Deno.env.get("EVOLUTION_TOKEN");
    const whatsappAtendente = Deno.env.get("WHATSAPP_ATENDENTE");

    const body: ChatMessageRequest = await req.json();
    console.log("Received chat message request:", body);
    console.log("Evolution Base URL:", evolutionBaseUrl);
    console.log("Evolution Instance:", evolutionInstance);

    // Validações de integridade
    const sanitizedPhone = (body.customerPhone || '').replace(/\D/g, '');
    if (!sanitizedPhone) throw new Error("Missing required field: customerPhone");
    if (!body.message || !body.ticketId) throw new Error("Missing required fields");
    if (body.attachmentBase64 && !body.attachmentFileName) {
      throw new Error("Attachment filename required when attachmentBase64 is provided");
    }

    // Formatar mensagem para o atendente
    const messageToAdmin = `[Novo contato do site]
Nome: ${body.customerName}
Telefone: ${body.customerPhone}
Setor: ${body.subject}
Mensagem: ${body.message}
${body.pageUrl ? `Página: ${body.pageUrl}` : ""}`;

    console.log("Message to admin:", messageToAdmin);

    let adminMessageSuccess = false;
    let customerMessageSuccess = false;
    let errorMessage = "";

    // Upload do anexo (se existir) e atualizar o ticket com URL pública
    let attachmentPublicUrl: string | null = null;
    if (body.attachmentBase64 && body.attachmentFileName) {
      try {
        // Garante bucket de anexos
        try {
          await supabase.storage.createBucket('chat_attachments', { public: true });
        } catch (_) {
          // Ignora erro se já existir
        }

        const fileBytes = Uint8Array.from(atob(body.attachmentBase64), (c) => c.charCodeAt(0));
        const path = `tickets/${body.ticketId}/${Date.now()}-${body.attachmentFileName}`;
        const uploadRes = await supabase.storage.from('chat_attachments').upload(path, fileBytes, {
          contentType: 'application/octet-stream',
          upsert: false,
        });
        if (!uploadRes.error) {
          const { data: pub } = await supabase.storage.from('chat_attachments').getPublicUrl(path);
          attachmentPublicUrl = pub?.publicUrl || null;
          // Atualiza o ticket com a URL do anexo
          await supabase
            .from('chat_tickets')
            .update({ attachment_url: attachmentPublicUrl })
            .eq('id', body.ticketId);
        }
      } catch (storageErr) {
        console.error('Storage upload error:', storageErr);
      }
    }

    // Enviar mensagem para o atendente
    if (evolutionBaseUrl && evolutionInstance && evolutionToken && whatsappAtendente) {
      try {
        console.log("Sending message to admin via Evolution API");
        const adminResponse = await fetch(
          `${evolutionBaseUrl}/message/sendText/${evolutionInstance}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": evolutionToken,
            },
            body: JSON.stringify({
              number: whatsappAtendente,
              text: messageToAdmin,
            }),
          }
        );

        if (adminResponse.ok) {
          adminMessageSuccess = true;
          console.log("Message sent to admin successfully");
        } else {
          const errorData = await adminResponse.text();
          errorMessage = `Admin message failed: ${errorData}`;
          console.error(errorMessage);
        }

        // Enviar anexo para o atendente se existir
        if (body.attachmentBase64 && body.attachmentFileName) {
          console.log("Sending attachment to admin");
          await fetch(
            `${evolutionBaseUrl}/message/sendMedia/${evolutionInstance}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "apikey": evolutionToken,
              },
              body: JSON.stringify({
                number: whatsappAtendente,
                mediaMessage: {
                  mediatype: "document",
                  caption: `Anexo do lead ${body.customerName}`,
                  fileName: body.attachmentFileName,
                  media: body.attachmentBase64,
                },
              }),
            }
          );
        }

        // Enviar mensagem de confirmação ao cliente
        const confirmationMessage = `Olá, ${body.customerName}! Recebi sua mensagem do site e vou responder por aqui. Assunto: ${body.subject}.`;
        
        console.log("Sending confirmation to customer");
        const customerResponse = await fetch(
          `${evolutionBaseUrl}/message/sendText/${evolutionInstance}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": evolutionToken,
            },
            body: JSON.stringify({
              number: body.customerPhone,
              text: confirmationMessage,
            }),
          }
        );

        if (customerResponse.ok) {
          customerMessageSuccess = true;
          console.log("Confirmation sent to customer successfully");
        } else {
          console.error("Customer confirmation failed");
        }
      } catch (error) {
        errorMessage = `Evolution API error: ${(error as Error).message}`;
        console.error(errorMessage);
      }
    } else {
      errorMessage = "Evolution API not configured";
      console.error(errorMessage);
    }

    // Registrar tentativa de envio
    const attemptStatus = adminMessageSuccess ? "success" : "failed";
    await supabase.from("chat_send_attempts").insert({
      ticket_id: body.ticketId,
      attempt_number: 1,
      status: attemptStatus,
      error_message: errorMessage || null,
    });

    // Atualizar status do ticket se houver falha
    if (!adminMessageSuccess) {
      await supabase
        .from("chat_tickets")
        .update({ status: "pending_retry" })
        .eq("id", body.ticketId);
    }

    // Registrar mensagem no banco com status da evolução
    await supabase.from("chat_messages").insert({
      ticket_id: body.ticketId,
      sender: "customer",
      message: body.message,
      evolution_status: adminMessageSuccess ? "sent" : "failed",
    });

    // Registrar mensagem do sistema com metadados básicos
    await supabase.from("chat_messages").insert({
      ticket_id: body.ticketId,
      sender: "system",
      message: `Assunto: ${body.subject}\nPágina: ${body.pageUrl || "-"}${attachmentPublicUrl ? `\nAnexo: ${attachmentPublicUrl}` : ''}`,
      evolution_status: "sent",
    });

    return new Response(
      JSON.stringify({
        success: adminMessageSuccess,
        adminMessageSent: adminMessageSuccess,
        customerMessageSent: customerMessageSuccess,
        error: errorMessage || null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: adminMessageSuccess ? 200 : 500,
      }
    );
  } catch (error: any) {
    console.error("Error in send-chat-message:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
