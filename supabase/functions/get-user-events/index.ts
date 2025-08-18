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

    // Étape 1: Récupérer les orchestres de l'utilisateur
    const { data: userOrchestras, error: orchestrasError } = await supabase
      .from('user_orchestras')
      .select('orchestra_id')
      .eq('user_id', userId);

    if (orchestrasError) {
      throw orchestrasError;
    }

    if (!userOrchestras || userOrchestras.length === 0) {
      // L'utilisateur n'est dans aucun orchestre, ne retourner aucun événement
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

    const orchestraIds = userOrchestras.map(uo => uo.orchestra_id);

    // Étape 2: Récupérer tous les événements concerts (publics)
    const { data: userConcerts, error: concertsError } = await supabase
      .from('event_orchestras')
      .select('event_id')
      .in('orchestra_id', orchestraIds);

    if (concertsError) {
      throw concertsError;
    }

    // Étape 4: Combiner tous les IDs d'événements
    const allEventIds = new Set();
    
    // Ajouter tous les événements (concerts ET répétitions) des orchestres de l'utilisateur
    if (userConcerts) {
      userConcerts.forEach(eo => allEventIds.add(eo.event_id));
    }

    if (allEventIds.size === 0) {
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

    // Étape 5: Récupérer les événements finaux avec leurs détails
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(`
        *,
        event_orchestras (
          orchestra_id,
          orchestras (
            id,
            name,
            description
          )
        )
      `)
      .in('id', Array.from(allEventIds))
      .order('event_date', { ascending: true });

    if (eventsError) {
      throw eventsError;
    }

    // Formater les données
    const formattedEvents = events?.map(event => ({
      ...event,
      orchestras: event.event_orchestras?.map(eo => eo.orchestras) || []
    })) || [];

    return new Response(
      JSON.stringify(formattedEvents),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Error in get-user-events function:', error);
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