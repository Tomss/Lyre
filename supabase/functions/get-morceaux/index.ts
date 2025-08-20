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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(`Missing environment variables`);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all morceaux with their orchestras
    const { data: morceaux, error } = await supabase
      .from('morceaux')
      .select(`
        *,
        morceau_orchestras (
          orchestras (
            id,
            name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Format the data to include orchestras array
    const formattedMorceaux = morceaux?.map(morceau => ({
      ...morceau,
      orchestras: morceau.morceau_orchestras?.map(mo => mo.orchestras).filter(Boolean) || []
    })) || [];

    return new Response(
      JSON.stringify(formattedMorceaux),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Error in get-morceaux function:', error);
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