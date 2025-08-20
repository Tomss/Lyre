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
    const morceauId = url.searchParams.get('morceauId');
    const instrumentId = url.searchParams.get('instrumentId');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(`Missing environment variables`);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
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
      .order('created_at', { ascending: false });

    // Filtrer par morceau si spécifié
    if (morceauId) {
      query = query.eq('morceau_id', morceauId);
    }

    // Filtrer par instrument si spécifié
    if (instrumentId) {
      query = query.eq('instrument_id', instrumentId);
    }

    const { data: partitions, error } = await query;

    if (error) {
      throw error;
    }

    // Format the data to include orchestras in morceaux
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
    console.error('Error in get-partitions function:', error);
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