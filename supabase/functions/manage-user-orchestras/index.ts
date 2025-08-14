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
    const { userId, orchestraIds } = await req.json();
    
    if (!userId) {
      throw new Error("User ID manquant");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(`Missing environment variables`);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Delete existing user orchestras
    const { error: deleteError } = await supabase
      .from('user_orchestras')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      throw deleteError;
    }

    // Insert new user orchestras if any
    if (orchestraIds && orchestraIds.length > 0) {
      const userOrchestras = orchestraIds.map((orchestraId: string) => ({
        user_id: userId,
        orchestra_id: orchestraId,
      }));

      const { error: insertError } = await supabase
        .from('user_orchestras')
        .insert(userOrchestras);

      if (insertError) {
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({ message: 'Orchestres mis à jour avec succès' }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Error in manage-user-orchestras function:', error);
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