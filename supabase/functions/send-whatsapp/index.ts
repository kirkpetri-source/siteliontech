// @ts-nocheck
// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Max-Age': '86400',
};

interface WhatsAppMessage {
  phoneNumber: string;
  message: string;
  messageType: 'contact' | 'order' | 'welcome' | 'custom' | 'quote' | 'chat';
  additionalData?: Record<string, any>;
  attachmentBase64?: string;
  attachmentFileName?: string;
}

// Consistent timezone: Brasília (America/Sao_Paulo)
const formatDateBR = () => new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    // CORS preflight
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const { phoneNumber, message, messageType, additionalData, attachmentBase64, attachmentFileName }: WhatsAppMessage = await req.json();

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
    const evolutionInstance = Deno.env.get('EVOLUTION_INSTANCE_NAME');

    if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstance) {
      throw new Error('Evolution API credentials not configured');
    }

    console.log('Sending WhatsApp message:', { phoneNumber, messageType });

    // Format phone number (remove special characters, ensure country code)
    const formattedPhone = phoneNumber.replace(/\D/g, '');
    const fullPhone = formattedPhone.startsWith('55') ? formattedPhone : `55${formattedPhone}`;

    // Prepare message based on type
    let finalMessage = message;
    
    if (messageType === 'contact' && additionalData) {
      finalMessage = `🦁 *Nova Mensagem de Contato - Lion Tech*\n\n` +
        `👤 *Nome:* ${additionalData.name}\n` +
        `📧 *Email:* ${additionalData.email}\n` +
        `📱 *Telefone:* ${additionalData.phone}\n` +
        `💬 *Mensagem:*\n${message}\n\n` +
        `⏰ *Data:* ${formatDateBR()}`;
    } else if (messageType === 'order' && additionalData) {
      finalMessage = `🛒 *Novo Pedido - Lion Tech*\n\n` +
        `👤 *Cliente:* ${additionalData.customerName}\n` +
        `📱 *Telefone:* ${additionalData.customerPhone}\n` +
        `💰 *Total:* R$ ${additionalData.total}\n` +
        `📦 *Produtos:*\n${additionalData.products}\n\n` +
        `⏰ *Data:* ${formatDateBR()}`;
    } else if (messageType === 'welcome') {
      // Mensagem formal ao cliente, sem emojis
      finalMessage =
        `Bem-vindo à Lion Tech!\n\n` +
        `Recebemos sua mensagem e vamos responder por aqui em breve.\n\n` +
        `WhatsApp: (64) 9 9955-5364\n` +
        `Site: liontech.com.br\n\n` +
        `Atendimento: Seg-Sex 8h-18h, Sáb 8h-12h`;
    } else if (messageType === 'quote' && additionalData) {
      // Somente dados preenchidos pelo cliente + serviço selecionado
      const lines: string[] = [];
      lines.push(`🦁 *Solicitação de Orçamento - Lion Tech*`);
      lines.push('');
      if (additionalData.serviceName) {
        lines.push(`🧩 *Serviço:* ${additionalData.serviceName}`);
      }
      if (additionalData.customerName) {
        lines.push(`👤 *Cliente:* ${additionalData.customerName}`);
      }
      const contactParts: string[] = [];
      if (additionalData.customerPhone) contactParts.push(additionalData.customerPhone);
      if (additionalData.customerContact) contactParts.push(additionalData.customerContact);
      if (contactParts.length > 0) {
        lines.push(`📱 *Contato:* ${contactParts.join(' / ')}`);
      }
      if (message) {
        lines.push('');
        lines.push('💬 *Detalhes:*');
        lines.push(message);
      }
      finalMessage = lines.join('\n');
    } else if (messageType === 'chat' && additionalData) {
      // Mensagem formal ao atendente quando um chat é iniciado
      const lines: string[] = [];
      lines.push(`Novo atendimento - Lion Tech`);
      lines.push('');
      if (additionalData.subject) {
        lines.push(`Assunto: ${additionalData.subject}`);
      }
      if (additionalData.customerName) {
        lines.push(`Nome: ${additionalData.customerName}`);
      }
      if (additionalData.customerPhone) {
        lines.push(`Telefone: ${additionalData.customerPhone}`);
      }
      if (additionalData.pageUrl) {
        lines.push(`Página: ${additionalData.pageUrl}`);
      }
      if (message) {
        lines.push('');
        lines.push('Mensagem do cliente:');
        lines.push(message);
      }
      lines.push('');
      lines.push(`Data: ${formatDateBR()}`);
      finalMessage = lines.join('\n');
    }

    // Send message via Evolution API
    const response = await fetch(`${evolutionApiUrl}/message/sendText/${evolutionInstance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({
        number: fullPhone,
        text: finalMessage,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Evolution API error:', errorData);
      throw new Error(`Evolution API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('WhatsApp message sent successfully:', result);

    // Optional: send attachment (chat or quote)
    if ((messageType === 'chat' || messageType === 'quote') && attachmentBase64 && attachmentFileName) {
      try {
        const mediaResp = await fetch(`${evolutionApiUrl}/message/sendMedia/${evolutionInstance}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey,
          },
          body: JSON.stringify({
            number: fullPhone,
            mediaMessage: {
              mediatype: 'document',
              caption: `Anexo do contato`,
              fileName: attachmentFileName,
              media: attachmentBase64,
            },
          }),
        });
        if (!mediaResp.ok) {
          const mediaErr = await mediaResp.text();
          console.error('Evolution API media error:', mediaErr);
        }
      } catch (mediaError) {
        console.error('Error sending media:', mediaError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, messageId: result.key?.id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
