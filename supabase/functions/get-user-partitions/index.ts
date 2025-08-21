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
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      throw new Error("User ID manquant");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(`Missing environment variables`);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Étape 1: Récupérer les instruments de l'utilisateur
    const { data: userInstruments, error: instrumentsError } = await supabase
      .from('user_instruments')
      .select('instrument_id')
      .eq('user_id', userId);

    if (instrumentsError) {
      throw instrumentsError;
    }

    // Étape 2: Récupérer les orchestres de l'utilisateur
    const { data: userOrchestras, error: orchestrasError } = await supabase
      .from('user_orchestras')
      .select('orchestra_id')
      .eq('user_id', userId);

    if (orchestrasError) {
      throw orchestrasError;
    }

    if (!userInstruments || userInstruments.length === 0 || !userOrchestras || userOrchestras.length === 0) {
      // L'utilisateur n'a pas d'instruments ou d'orchestres
      return new Response(
        JSON.stringify([]),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    const instrumentIds = userInstruments.map(ui => ui.instrument_id);
    const orchestraIds = userOrchestras.map(uo => uo.orchestra_id);

    // Étape 3: Récupérer les morceaux des orchestres de l'utilisateur
    const { data: morceauOrchestras, error: morceauOrchestrasError } = await supabase
      .from('morceau_orchestras')
      .select('morceau_id')
      .in('orchestra_id', orchestraIds);

    if (morceauOrchestrasError) {
      throw morceauOrchestrasError;
    }

    if (!morceauOrchestras || morceauOrchestras.length === 0) {
      return new Response(
        JSON.stringify([]),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    const morceauIds = morceauOrchestras.map(mo => mo.morceau_id);

    // Étape 4: Récupérer les partitions correspondantes
    const { data: partitions, error: partitionsError } = await supabase
      .from('partitions')
      .select(`
        *,
        morceaux (
          id,
          nom,
          compositeur,
          arrangement,
          morceau_orchestras (
            orchestras (
              id,
              name
            )
          )
        ),
        instruments (
          id,
          name
        )
      `)
      .in('morceau_id', morceauIds)
      .in('instrument_id', instrumentIds)
      .order('created_at', { ascending: false });

    if (partitionsError) {
      throw partitionsError;
    }

    // Formater les données pour inclure les orchestres dans les morceaux
    const formattedPartitions = partitions?.map(partition => ({
      ...partition,
      morceaux: {
        ...partition.morceaux,
        orchestras: partition.morceaux.morceau_orchestras?.map(mo => mo.orchestras).filter(Boolean) || []
      }
    })) || [];

    return new Response(
      JSON.stringify(formattedPartitions),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Error in get-user-partitions function:', error);
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