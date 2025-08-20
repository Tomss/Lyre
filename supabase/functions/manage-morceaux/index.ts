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
    const { action, id, nom, compositeur, arrangement, orchestra_ids } = await req.json();
    
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
        if (!nom || !orchestra_ids || orchestra_ids.length === 0) {
          throw new Error("Nom du morceau et orchestres requis");
        }
        
        // Créer le morceau
        const { data: createData, error: createError } = await supabase
          .from('morceaux')
          .insert({ nom, compositeur, arrangement })
          .select()
          .single();
        
        if (createError) throw createError;

        // Associer les orchestres
        const morceauOrchestras = orchestra_ids.map((orchestra_id: string) => ({
          morceau_id: createData.id,
          orchestra_id
        }));

        const { error: orchestraError } = await supabase
          .from('morceau_orchestras')
          .insert(morceauOrchestras);

        if (orchestraError) throw orchestraError;

        result = createData;
        message = 'Morceau créé avec succès';
        break;

      case 'update':
        if (!id || !nom || !orchestra_ids || orchestra_ids.length === 0) {
          throw new Error("ID, nom et orchestres requis");
        }
        
        // Mettre à jour le morceau
        const { data: updateData, error: updateError } = await supabase
          .from('morceaux')
          .update({ nom, compositeur, arrangement })
          .eq('id', id)
          .select()
          .single();
        
        if (updateError) throw updateError;

        // Supprimer les anciennes associations
        const { error: deleteOrchestraError } = await supabase
          .from('morceau_orchestras')
          .delete()
          .eq('morceau_id', id);

        if (deleteOrchestraError) throw deleteOrchestraError;

        // Créer les nouvelles associations
        const newMorceauOrchestras = orchestra_ids.map((orchestra_id: string) => ({
          morceau_id: id,
          orchestra_id
        }));

        const { error: newOrchestraError } = await supabase
          .from('morceau_orchestras')
          .insert(newMorceauOrchestras);

        if (newOrchestraError) throw newOrchestraError;

        result = updateData;
        message = 'Morceau mis à jour avec succès';
        break;

      case 'delete':
        if (!id) throw new Error("ID requis");
        
        const { error: deleteError } = await supabase
          .from('morceaux')
          .delete()
          .eq('id', id);
        
        if (deleteError) throw deleteError;
        message = 'Morceau supprimé avec succès';
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
    console.error('Error in manage-morceaux function:', error);
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