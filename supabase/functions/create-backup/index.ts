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

    const { type = 'manual' } = await req.json().catch(() => ({ type: 'manual' }));
    
    console.log(`Starting backup process - Type: ${type}`);

    // Get auth header to identify user
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      userId = user?.id;
    }

    // Create backup record
    const { data: backupRecord, error: backupError } = await supabaseClient
      .from('backups')
      .insert({
        status: 'in_progress',
        type,
        created_by: userId,
      })
      .select()
      .single();

    if (backupError) {
      console.error('Error creating backup record:', backupError);
      throw backupError;
    }

    console.log(`Backup record created: ${backupRecord.id}`);

    // Define tables to backup
    const tables = [
      'products',
      'orders',
      'order_items',
      'contacts',
      'coupons',
      'stock_movements',
    ];

    const backupData: any = {};
    let totalSize = 0;

    // Export data from each table
    for (const table of tables) {
      try {
        console.log(`Backing up table: ${table}`);
        
        const { data, error } = await supabaseClient
          .from(table)
          .select('*');

        if (error) {
          console.error(`Error backing up ${table}:`, error);
          continue;
        }

        backupData[table] = data;
        const tableSize = JSON.stringify(data).length;
        totalSize += tableSize;
        
        console.log(`Table ${table} backed up: ${data?.length || 0} records, ${tableSize} bytes`);
      } catch (error) {
        console.error(`Error processing table ${table}:`, error);
      }
    }

    // Convert backup data to JSON string
    const backupJson = JSON.stringify(backupData, null, 2);
    const finalSize = backupJson.length;

    console.log(`Backup completed - Total size: ${finalSize} bytes`);

    // Update backup record with success
    const { error: updateError } = await supabaseClient
      .from('backups')
      .update({
        status: 'completed',
        file_size: finalSize,
        tables_backed_up: tables,
        completed_at: new Date().toISOString(),
      })
      .eq('id', backupRecord.id);

    if (updateError) {
      console.error('Error updating backup record:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        backup_id: backupRecord.id,
        size: finalSize,
        tables: tables,
        data: backupData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Backup failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao criar backup',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
