import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Webhook received:', JSON.stringify(body, null, 2));

    // Mercado Pago sends notification in this format
    const { type, data } = body;

    if (type === 'payment') {
      const paymentId = data.id;
      console.log('Processing payment notification:', paymentId);

      // Get payment details from Mercado Pago
      const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const payment = await response.json();
      console.log('Payment details:', JSON.stringify(payment, null, 2));

      // Update order in database
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const orderId = payment.metadata?.order_id;
      
      if (orderId) {
        const updateData: any = {
          payment_id: payment.id.toString(),
          payment_status: payment.status,
          payment_type: payment.payment_method_id,
          updated_at: new Date().toISOString(),
        };

        // Update order status based on payment status
        if (payment.status === 'approved') {
          updateData.status = 'processing';
        } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
          updateData.status = 'cancelled';
        }

        console.log('Updating order:', orderId, 'with data:', updateData);

        const { error } = await supabase
          .from('orders')
          .update(updateData)
          .eq('id', orderId);

        if (error) {
          console.error('Error updating order:', error);
          throw error;
        }

        console.log('Order updated successfully');
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);
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
