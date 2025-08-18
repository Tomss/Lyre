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

    // Récupérer les événements de l'utilisateur (concerts publics + répétitions de ses orchestres)
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        *,
        event_orchestras!inner (
          orchestra_id,
          orchestras (
            id,
            name,
            description
          )
        )
      `)
      .or(`
        event_type.eq.concert,
        and(
          event_type.eq.repetition,
          event_orchestras.orchestra_id.in.(
            select orchestra_id from user_orchestras where user_id = '${userId}'
          )
        )
      `)
      .order('event_date', { ascending: true });

    if (error) {
      throw error;
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