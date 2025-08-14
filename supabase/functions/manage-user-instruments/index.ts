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
    const { userId, instrumentIds } = await req.json();
    
    if (!userId) {
      throw new Error("User ID manquant");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(`Missing environment variables`);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Delete existing user instruments
    const { error: deleteError } = await supabase
      .from('user_instruments')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      throw deleteError;
    }

    // Insert new user instruments if any
    if (instrumentIds && instrumentIds.length > 0) {
      const userInstruments = instrumentIds.map((instrumentId: string) => ({
        user_id: userId,
        instrument_id: instrumentId,
      }));

      const { error: insertError } = await supabase
        .from('user_instruments')
        .insert(userInstruments);

      if (insertError) {
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({ message: 'Instruments mis à jour avec succès' }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Error in manage-user-instruments function:', error);
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