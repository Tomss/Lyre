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
    const type = url.searchParams.get('type'); // 'admin' ou 'user'
    const userId = url.searchParams.get('userId');
    
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
        instruments (id, name),
        orchestras (id, name),
        profiles (first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (type === 'user' && userId) {
      // Partitions pour un utilisateur spécifique
      // L'utilisateur doit jouer l'instrument ET faire partie de l'orchestre
      const { data: userPartitions, error: userError } = await supabase
        .rpc('get_user_partitions', { user_id: userId });

      if (userError) {
        throw userError;
      }

      return new Response(
        JSON.stringify(userPartitions || []),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Pour les admins : toutes les partitions
    const { data: partitions, error } = await query;

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify(partitions || []),
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