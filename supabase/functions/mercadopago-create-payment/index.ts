import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    // Preflight precisa responder com status 200 e cabeçalhos completos
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const { orderId, paymentMethod, paymentData } = await req.json();
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');

    if (!accessToken) {
      throw new Error('Mercado Pago access token not configured');
    }

    console.log('Creating payment for order:', orderId, 'Method:', paymentMethod);

    let paymentBody: any = {
      transaction_amount: paymentData.transaction_amount,
      description: paymentData.description,
      payment_method_id: paymentMethod,
      payer: {
        email: paymentData.payer.email,
        first_name: paymentData.payer.first_name,
      },
      metadata: {
        order_id: orderId,
      },
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
    };

    // Add payment method specific data
    if (paymentMethod === 'pix') {
      // PIX payment
      console.log('Creating PIX payment');
    } else {
      // Card payment
      paymentBody = {
        ...paymentBody,
        token: paymentData.token,
        installments: paymentData.installments || 1,
        issuer_id: paymentData.issuer_id,
        payer: {
          ...paymentBody.payer,
          identification: paymentData.payer.identification,
        },
      };
    }

    console.log('Sending payment request to Mercado Pago...');

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${orderId}-${Date.now()}`,
      },
      body: JSON.stringify(paymentBody),
    });

    const payment = await response.json();

    console.log('Payment response:', payment);

    if (!response.ok) {
      console.error('Payment error:', payment);
      throw new Error(payment.message || 'Payment failed');
    }

    return new Response(
      JSON.stringify({
        id: payment.id,
        status: payment.status,
        status_detail: payment.status_detail,
        payment_method_id: payment.payment_method_id,
        qr_code: payment.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64,
        ticket_url: payment.point_of_interaction?.transaction_data?.ticket_url,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
