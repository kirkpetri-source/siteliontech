import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const evolutionBaseUrl = Deno.env.get("EVOLUTION_BASE_URL");
    const evolutionInstance = Deno.env.get("EVOLUTION_INSTANCE");
    const evolutionToken = Deno.env.get("EVOLUTION_TOKEN");
    const whatsappAtendente = Deno.env.get("WHATSAPP_ATENDENTE");

    const body: ChatMessageRequest = await req.json();
    console.log("Received chat message request:", body);

    // Validar campos obrigatórios
    if (!body.customerPhone || !body.message || !body.ticketId) {
      throw new Error("Missing required fields");
    }

    // Formatar mensagem para o atendente
    const messageToAdmin = `[Novo contato do site]
Nome: ${body.customerName}
Telefone: ${body.customerPhone}
Setor: ${body.subject}
Mensagem: ${body.message}
${body.pageUrl ? `Página: ${body.pageUrl}` : ""}`;

    let adminMessageSuccess = false;
    let customerMessageSuccess = false;
    let errorMessage = "";

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
              textMessage: {
                text: messageToAdmin,
              },
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

        // Enviar anexo se existir
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
              textMessage: {
                text: confirmationMessage,
              },
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

    // Registrar mensagem no banco
    await supabase.from("chat_messages").insert({
      ticket_id: body.ticketId,
      sender: "customer",
      message: body.message,
      evolution_status: adminMessageSuccess ? "sent" : "failed",
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
