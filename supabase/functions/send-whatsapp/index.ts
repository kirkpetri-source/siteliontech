import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppMessage {
  phoneNumber: string;
  message: string;
  messageType: 'contact' | 'order' | 'welcome' | 'custom';
  additionalData?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber, message, messageType, additionalData }: WhatsAppMessage = await req.json();

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
        `⏰ *Data:* ${new Date().toLocaleString('pt-BR')}`;
    } else if (messageType === 'order' && additionalData) {
      finalMessage = `🛒 *Novo Pedido - Lion Tech*\n\n` +
        `👤 *Cliente:* ${additionalData.customerName}\n` +
        `📱 *Telefone:* ${additionalData.customerPhone}\n` +
        `💰 *Total:* R$ ${additionalData.total}\n` +
        `📦 *Produtos:*\n${additionalData.products}\n\n` +
        `⏰ *Data:* ${new Date().toLocaleString('pt-BR')}`;
    } else if (messageType === 'welcome') {
      finalMessage = `🦁 *Bem-vindo à Lion Tech!*\n\n` +
        `Olá! Obrigado por entrar em contato conosco.\n\n` +
        `Nossa equipe está analisando sua mensagem e responderá em breve.\n\n` +
        `📱 WhatsApp: (64) 9 9955-5364\n` +
        `🌐 Site: liontech.com.br\n\n` +
        `_Atendimento: Seg-Sex 8h-18h, Sáb 8h-12h_`;
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
