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

    // D'abord, récupérer les orchestres de l'utilisateur
    const { data: userOrchestras, error: orchestraError } = await supabase
      .from('user_orchestras')
      .select('orchestra_id')
      .eq('user_id', userId);

    if (orchestraError) {
      throw orchestraError;
    }

    if (!userOrchestras || userOrchestras.length === 0) {
      // L'utilisateur n'est dans aucun orchestre, retourner seulement les concerts publics
      const { data: publicEvents, error: publicError } = await supabase
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
        .eq('event_type', 'concert')
        .order('event_date', { ascending: true });

      if (publicError) throw publicError;

      const formattedEvents = publicEvents?.map(event => ({
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
    }

    const orchestraIds = userOrchestras.map(uo => uo.orchestra_id);

    // Récupérer tous les événements (concerts publics + répétitions des orchestres de l'utilisateur)
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
      .or(`event_type.eq.concert,and(event_type.eq.repetition,event_orchestras.orchestra_id.in.(${orchestraIds.join(',')}))`)
      .order('event_date', { ascending: true });

    if (error) {
      throw error;
    }

    // Formater les données et filtrer selon la logique métier
    const formattedEvents = events?.map(event => ({
      ...event,
      orchestras: event.event_orchestras?.map(eo => eo.orchestras) || []
    })).filter(event => {
      // Pour les concerts : toujours inclure
      if (event.event_type === 'concert') {
        return true;
      }
      // Pour les répétitions : seulement si l'utilisateur est dans au moins un des orchestres
      if (event.event_type === 'repetition') {
        return event.event_orchestras?.some(eo => orchestraIds.includes(eo.orchestra_id));
      }
      return false;
    }) || [];

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