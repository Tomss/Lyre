// supabase/functions/update-user/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { id, first_name, last_name, role, password } = await req.json();
    if (!id) throw new Error("ID utilisateur manquant");

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Mettre à jour le profil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ first_name, last_name, role })
      .eq('id', id);
    if (profileError) throw profileError;

    // Mettre à jour le mot de passe seulement s'il est fourni
    if (password) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, { password });
      if (authError) throw authError;
    }

    return new Response(JSON.stringify({ message: 'Utilisateur mis à jour' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});