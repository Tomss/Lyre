import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { action, id, nom, morceau_id, instrument_id, file_path, file_name, file_type, file_size } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(`Missing environment variables`);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let result;
    let message;

    switch (action) {
      case 'create':
        if (!nom || !morceau_id || !instrument_id) {
          throw new Error("Nom, morceau et instrument requis");
        }
        
        const { data: createData, error: createError } = await supabase
          .from('partitions')
          .insert({ 
            nom, 
            morceau_id, 
            instrument_id,
            file_path,
            file_name,
            file_type,
            file_size
          })
          .select()
          .single();
        
        if (createError) throw createError;

        result = createData;
        message = 'Partition créée avec succès';
        break;

      case 'update':
        if (!id || !nom || !morceau_id || !instrument_id) {
          throw new Error("ID, nom, morceau et instrument requis");
        }
        
        const { data: updateData, error: updateError } = await supabase
          .from('partitions')
          .update({ 
            nom, 
            morceau_id, 
            instrument_id,
            file_path,
            file_name,
            file_type,
            file_size
          })
          .eq('id', id)
          .select()
          .single();
        
        if (updateError) throw updateError;

        result = updateData;
        message = 'Partition mise à jour avec succès';
        break;

      case 'delete':
        if (!id) throw new Error("ID requis");
        
        const { error: deleteError } = await supabase
          .from('partitions')
          .delete()
          .eq('id', id);
        
        if (deleteError) throw deleteError;
        message = 'Partition supprimée avec succès';
        break;

      default:
        throw new Error("Action non supportée");
    }

    return new Response(
      JSON.stringify({ message, data: result }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Error in manage-partitions function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});