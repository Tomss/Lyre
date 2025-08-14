import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Check environment variables first
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      });
      
      return new Response(
        JSON.stringify({ 
          error: `Missing environment variables: ${!supabaseUrl ? 'SUPABASE_URL ' : ''}${!supabaseServiceKey ? 'SUPABASE_SERVICE_ROLE_KEY' : ''}`.trim()
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    console.log('Environment variables OK, creating Supabase client...');

    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey
    );

    console.log('Fetching auth users...');
    
    // Get users from auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: `Auth error: ${authError.message}` }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    if (!authData || !authData.users) {
      console.error('No auth data returned');
      return new Response(
        JSON.stringify({ error: 'No auth data returned from Supabase' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    console.log(`Found ${authData.users.length} auth users`);

    // Get profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*');

    if (profilesError) {
      console.error('Profiles error:', profilesError);
      return new Response(
        JSON.stringify({ error: `Profiles error: ${profilesError.message}` }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    if (!profiles) {
      console.error('No profiles data returned');
      return new Response(
        JSON.stringify({ error: 'No profiles data returned from Supabase' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    console.log(`Found ${profiles.length} profiles`);

    // Combine auth and profile data
    const combinedData = profiles.map(profile => {
      const authUser = authData.users.find(u => u.id === profile.id);
      return {
        ...profile,
        email: authUser ? authUser.email : 'Non trouvé',
      };
    });

    console.log(`Returning ${combinedData.length} combined user records`);

    return new Response(
      JSON.stringify(combinedData),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('Unexpected error in get-all-users:', error);
    
    const errorMessage = error instanceof Error ? error.message : 
                        typeof error === 'string' ? error : 
                        'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ error: `Unexpected error: ${errorMessage}` }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});