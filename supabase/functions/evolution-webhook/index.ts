// @ts-nocheck
// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Max-Age': '86400',
};

interface EvolutionWebhookBody {
  number?: string; // sender phone
  message?: string; // text body
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
    const evolutionInstance = Deno.env.get('EVOLUTION_INSTANCE_NAME');

    const body: EvolutionWebhookBody = await req.json();
    const text = (body.message || '').trim();
    const sender = (body.number || '').replace(/\D/g, '');

    // Commands format examples:
    // #orcamento <id> pronto
    // #status <id> ready
    const match = text.match(/^#(orcamento|status)\s+([a-f0-9\-]{8,})\s+(\w+)/i);
    if (!match) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    const [, , quoteId, statusRaw] = match;
    const statusMap: Record<string, string> = {
      pronto: 'ready',
      ready: 'ready',
      enviado: 'sent',
      sent: 'sent',
      aprovado: 'approved',
      approved: 'approved',
      reprovado: 'rejected',
      rejected: 'rejected',
      analise: 'in_progress',
      in_progress: 'in_progress',
    };

    const status = statusMap[statusRaw.toLowerCase()];
    if (!status) {
      return new Response(JSON.stringify({ ok: false, error: 'invalid_status' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    await supabase.from('quotes' as any).update({ status }).eq('id', quoteId);

    // Optional confirmation back to sender
    if (evolutionApiUrl && evolutionApiKey && evolutionInstance) {
      await fetch(`${evolutionApiUrl}/message/sendText/${evolutionInstance}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': evolutionApiKey },
        body: JSON.stringify({
          number: sender,
          text: `Status do orçamento ${quoteId.slice(0,8)} atualizado para: ${status}`,
        }),
      });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});