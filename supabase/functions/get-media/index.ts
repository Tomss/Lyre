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
    const mediaType = url.searchParams.get('type'); // 'album', 'enregistrement', etc.
    const featured = url.searchParams.get('featured'); // 'true' pour les médias mis en avant
    const published = url.searchParams.get('published') ?? 'true'; // Par défaut, seulement les publiés
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(`Missing environment variables`);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('media_items')
      .select(`
        *,
        media_files (
          id,
          file_name,
          file_path,
          file_type,
          file_size,
          mime_type,
          alt_text,
          sort_order
        ),
        profiles (
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false });

    // Filtrer par type si spécifié
    if (mediaType) {
      query = query.eq('media_type', mediaType);
    }

    // Filtrer par statut mis en avant
    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    // Filtrer par statut publié
    if (published === 'true') {
      query = query.eq('published', true);
    }

    const { data: mediaItems, error } = await query;

    if (error) {
      throw error;
    }

    // Trier les fichiers par sort_order
    const formattedMedia = mediaItems?.map(item => ({
      ...item,
      media_files: item.media_files?.sort((a, b) => a.sort_order - b.sort_order) || []
    })) || [];

    return new Response(
      JSON.stringify(formattedMedia),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Error in get-media function:', error);
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