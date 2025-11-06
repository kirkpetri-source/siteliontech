import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { backupData, mode = 'preview' } = await req.json();
    
    console.log(`Restore backup - Mode: ${mode}`);

    if (!backupData || typeof backupData !== 'object') {
      throw new Error('Dados de backup inválidos');
    }

    // Get auth header to identify user
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      userId = user?.id;
      
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      // Check if user is admin
      const { data: roles } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      const isAdmin = roles?.some(r => r.role === 'admin');
      if (!isAdmin) {
        throw new Error('Acesso negado. Apenas administradores podem restaurar backups.');
      }
    } else {
      throw new Error('Autenticação necessária');
    }

    // If preview mode, just analyze and return stats
    if (mode === 'preview') {
      const stats: any = {};
      let totalRecords = 0;

      for (const [table, records] of Object.entries(backupData)) {
        if (Array.isArray(records)) {
          stats[table] = {
            count: records.length,
            sample: records.slice(0, 3), // First 3 records as sample
          };
          totalRecords += records.length;
        }
      }

      console.log(`Preview generated - Total records: ${totalRecords}`);

      return new Response(
        JSON.stringify({
          success: true,
          mode: 'preview',
          stats,
          totalRecords,
          tables: Object.keys(backupData),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Restore mode - actually restore the data
    console.log('Starting data restoration...');

    const results: any = {
      success: [],
      failed: [],
      skipped: [],
    };

    // Define table restoration order (respecting foreign keys)
    const tableOrder = [
      'products',
      'coupons',
      'orders',
      'order_items',
      'contacts',
      'stock_movements',
    ];

    // First, delete existing data (in reverse order)
    for (const table of [...tableOrder].reverse()) {
      if (backupData[table] && Array.isArray(backupData[table])) {
        try {
          console.log(`Clearing table: ${table}`);
          const { error } = await supabaseClient
            .from(table)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
          
          if (error) {
            console.error(`Error clearing ${table}:`, error);
          }
        } catch (error) {
          console.error(`Error clearing ${table}:`, error);
        }
      }
    }

    // Then restore data in correct order
    for (const table of tableOrder) {
      const records = backupData[table];
      
      if (!records || !Array.isArray(records)) {
        results.skipped.push({
          table,
          reason: 'No data in backup',
        });
        continue;
      }

      if (records.length === 0) {
        results.skipped.push({
          table,
          reason: 'Empty table',
        });
        continue;
      }

      try {
        console.log(`Restoring ${records.length} records to ${table}...`);

        // Insert in batches of 100 to avoid timeouts
        const batchSize = 100;
        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, i + batchSize);
          
          const { error } = await supabaseClient
            .from(table)
            .insert(batch);

          if (error) {
            console.error(`Error restoring batch to ${table}:`, error);
            throw error;
          }
        }

        results.success.push({
          table,
          count: records.length,
        });

        console.log(`Successfully restored ${records.length} records to ${table}`);
      } catch (error) {
        console.error(`Failed to restore ${table}:`, error);
        results.failed.push({
          table,
          error: error instanceof Error ? error.message : 'Unknown error',
          count: records.length,
        });
      }
    }

    // Create backup record for the restoration
    await supabaseClient
      .from('backups')
      .insert({
        status: 'completed',
        type: 'restore',
        tables_backed_up: results.success.map((s: any) => s.table),
        completed_at: new Date().toISOString(),
        created_by: userId,
      });

    console.log('Restoration completed');

    return new Response(
      JSON.stringify({
        success: true,
        mode: 'restore',
        results,
        message: `Restauração concluída: ${results.success.length} tabelas restauradas, ${results.failed.length} falharam, ${results.skipped.length} ignoradas`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Restore failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao restaurar backup',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
