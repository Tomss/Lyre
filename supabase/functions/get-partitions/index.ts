import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { data: partitions, error } = await supabase
      .from('partitions')
      .select(`
        *,
        instruments(id, name),
        morceaux(id, nom, compositeur, arrangement, morceau_orchestras(orchestras(id, name)))
      `);

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify(partitions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    // Retourner un message d'erreur clair en cas de problème
    return new Response(JSON.stringify({ error: `Erreur de base de données : ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})