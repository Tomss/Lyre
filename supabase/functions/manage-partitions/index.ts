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
    const { action, id, morceau_id, instrument_id, voice, file_name, file_path, file_type, file_size, mime_type } = await req.json();
    
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
        if (!morceau_id || !instrument_id || !file_name || !file_path || !file_type) {
          throw new Error("Morceau, instrument et fichier requis");
        }
        
        const { data: createData, error: createError } = await supabase
          .from('partitions')
          .insert({ 
            morceau_id,
            instrument_id, 
            voice, 
            file_name, 
            file_path, 
            file_type, 
            file_size, 
            mime_type 
          })
          .select(`
            *,
            instruments (id, name),
            morceaux (
              id,
              nom,
              compositeur,
              arrangement,
              morceau_orchestras (
                orchestra_id,
                orchestras (id, name)
              )
            )
          `)
          .single();
        
        if (createError) throw createError;
        result = createData;
        message = 'Partition créée avec succès';
        break;

      case 'update':
        if (!id || !morceau_id || !instrument_id) {
          throw new Error("ID, morceau et instrument requis");
        }
        
        const updateData: any = { 
          morceau_id,
          instrument_id, 
          voice
        };

        // Ajouter les données du fichier seulement si un nouveau fichier est fourni
        if (file_name && file_path && file_type) {
          updateData.file_name = file_name;
          updateData.file_path = file_path;
          updateData.file_type = file_type;
          updateData.file_size = file_size;
          updateData.mime_type = mime_type;
        }
        
        const { data: updateResult, error: updateError } = await supabase
          .from('partitions')
          .update(updateData)
          .eq('id', id)
          .select(`
            *,
            instruments (id, name),
            morceaux (
              id,
              nom,
              compositeur,
              arrangement,
              morceau_orchestras (
                orchestra_id,
                orchestras (id, name)
              )
            )
          `)
          .single();
        
        if (updateError) throw updateError;
        result = updateResult;
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