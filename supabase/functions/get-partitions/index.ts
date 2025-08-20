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
    const morceauId = url.searchParams.get('morceauId'); // Pour filtrer par morceau
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(`Missing environment variables`);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (type === 'user' && userId) {
      // Partitions pour un utilisateur spécifique groupées par morceau
      const { data: userPartitions, error: userError } = await supabase
        .rpc('get_user_partitions_by_morceaux', { user_id: userId });

      if (userError) {
        throw userError;
      }

      // Grouper les résultats par morceau
      const groupedPartitions = {};
      userPartitions?.forEach(row => {
        if (!groupedPartitions[row.morceau_id]) {
          groupedPartitions[row.morceau_id] = {
            id: row.morceau_id,
            nom: row.morceau_nom,
            compositeur: row.morceau_compositeur,
            arrangement: row.morceau_arrangement,
            created_at: row.morceau_created_at,
            orchestras: row.orchestra_names?.map((name, index) => ({
              id: row.orchestra_ids[index],
              name: name
            })) || [],
            partitions: []
          };
        }
        
        groupedPartitions[row.morceau_id].partitions.push({
          id: row.partition_id,
          voice: row.partition_voice,
          file_name: row.partition_file_name,
          file_path: row.partition_file_path,
          file_type: row.partition_file_type,
          file_size: row.partition_file_size,
          mime_type: row.partition_mime_type,
          created_at: row.partition_created_at,
          instrument: {
            id: row.instrument_id,
            name: row.instrument_name
          }
        });
      });

      return new Response(
        JSON.stringify(Object.values(groupedPartitions)),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Pour les admins : toutes les partitions avec détails complets
    let query = supabase
      .from('partitions')
      .select(`
        *,
        instruments (id, name),
        morceaux (
          id,
          nom,
          compositeur,
          arrangement,
          morceau_orchestras (
            orchestra_id,
            orchestras (id, name)
          )
        ),
        profiles (first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (morceauId) {
      query = query.eq('morceau_id', morceauId);
    }

    const { data: partitions, error } = await query;

    if (error) {
      throw error;
    }

    // Formater les données pour inclure les orchestres
    const formattedPartitions = partitions?.map(partition => ({
      ...partition,
      orchestras: partition.morceaux?.morceau_orchestras?.map(mo => mo.orchestras).filter(Boolean) || []
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