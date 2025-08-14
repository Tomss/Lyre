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
    const { action, id, name } = await req.json();
    
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
        if (!name) throw new Error("Nom de l'instrument requis");
        
        const { data: createData, error: createError } = await supabase
          .from('instruments')
          .insert({ name })
          .select()
          .single();
        
        if (createError) throw createError;
        result = createData;
        message = 'Instrument créé avec succès';
        break;

      case 'update':
        if (!id || !name) throw new Error("ID et nom requis");
        
        const { data: updateData, error: updateError } = await supabase
          .from('instruments')
          .update({ name })
          .eq('id', id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        result = updateData;
        message = 'Instrument mis à jour avec succès';
        break;

      case 'delete':
        if (!id) throw new Error("ID requis");
        
        const { error: deleteError } = await supabase
          .from('instruments')
          .delete()
          .eq('id', id);
        
        if (deleteError) throw deleteError;
        message = 'Instrument supprimé avec succès';
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
    console.error('Error in manage-instruments function:', error);
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