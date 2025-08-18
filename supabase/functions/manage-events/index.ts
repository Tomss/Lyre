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
    const { action, id, title, description, event_type, event_date, location, orchestra_ids } = await req.json();
    
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
        if (!title || !event_type || !event_date || !orchestra_ids || orchestra_ids.length === 0) {
          throw new Error("Titre, type, date et orchestres requis");
        }
        
        // Créer l'événement
        const { data: createData, error: createError } = await supabase
          .from('events')
          .insert({ 
            title, 
            description, 
            event_type, 
            event_date, 
            location 
          })
          .select()
          .single();
        
        if (createError) throw createError;

        // Associer les orchestres
        const eventOrchestras = orchestra_ids.map((orchestra_id: string) => ({
          event_id: createData.id,
          orchestra_id
        }));

        const { error: orchestraError } = await supabase
          .from('event_orchestras')
          .insert(eventOrchestras);

        if (orchestraError) throw orchestraError;

        result = createData;
        message = 'Événement créé avec succès';
        break;

      case 'update':
        if (!id || !title || !event_type || !event_date || !orchestra_ids || orchestra_ids.length === 0) {
          throw new Error("ID, titre, type, date et orchestres requis");
        }
        
        // Mettre à jour l'événement
        const { data: updateData, error: updateError } = await supabase
          .from('events')
          .update({ 
            title, 
            description, 
            event_type, 
            event_date, 
            location 
          })
          .eq('id', id)
          .select()
          .single();
        
        if (updateError) throw updateError;

        // Supprimer les anciennes associations
        const { error: deleteOrchestraError } = await supabase
          .from('event_orchestras')
          .delete()
          .eq('event_id', id);

        if (deleteOrchestraError) throw deleteOrchestraError;

        // Créer les nouvelles associations
        const newEventOrchestras = orchestra_ids.map((orchestra_id: string) => ({
          event_id: id,
          orchestra_id
        }));

        const { error: newOrchestraError } = await supabase
          .from('event_orchestras')
          .insert(newEventOrchestras);

        if (newOrchestraError) throw newOrchestraError;

        result = updateData;
        message = 'Événement mis à jour avec succès';
        break;

      case 'delete':
        if (!id) throw new Error("ID requis");
        
        const { error: deleteError } = await supabase
          .from('events')
          .delete()
          .eq('id', id);
        
        if (deleteError) throw deleteError;
        message = 'Événement supprimé avec succès';
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
    console.error('Error in manage-events function:', error);
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