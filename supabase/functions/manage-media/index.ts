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
    const { action, id, title, description, media_type, published, is_featured, files, filesToRemove } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(`Missing environment variables`);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Vérifier les permissions
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header manquant');
    }

    let result;
    let message;

    switch (action) {
      case 'create':
        if (!title || !media_type) {
          throw new Error("Titre et type de média requis");
        }
        
        // Créer l'élément média
        const { data: createData, error: createError } = await supabase
          .from('media_items')
          .insert({ 
            title, 
            description, 
            media_type,
            published: published ?? true,
            is_featured: is_featured ?? false
          })
          .select()
          .single();
        
        if (createError) throw createError;

        // Ajouter les fichiers si fournis
        if (files && files.length > 0) {
          const mediaFiles = files.map((file: any, index: number) => ({
            media_item_id: createData.id,
            file_name: file.file_name,
            file_path: file.file_path,
            file_type: file.file_type,
            file_size: file.file_size,
            mime_type: file.mime_type,
            alt_text: file.alt_text,
            sort_order: index
          }));

          const { error: filesError } = await supabase
            .from('media_files')
            .insert(mediaFiles);

          if (filesError) throw filesError;
        }

        result = createData;
        message = 'Média créé avec succès';
        break;

      case 'update':
        if (!id || !title || !media_type) {
          throw new Error("ID, titre et type requis");
        }
        
        // Mettre à jour l'élément média
        const { data: updateData, error: updateError } = await supabase
          .from('media_items')
          .update({ 
            title, 
            description, 
            media_type,
            published: published ?? true,
            is_featured: is_featured ?? false
          })
          .eq('id', id)
          .select()
          .single();
        
        if (updateError) throw updateError;

        // Gérer les fichiers si fournis
        // Supprimer les fichiers spécifiquement marqués pour suppression
        if (filesToRemove && filesToRemove.length > 0) {
          const { error: deleteFilesError } = await supabase
            .from('media_files')
            .delete()
            .in('id', filesToRemove);

          if (deleteFilesError) throw deleteFilesError;
        }

        // Ajouter les nouveaux fichiers si fournis
        if (files && files.length > 0) {
          // Récupérer le nombre de fichiers existants pour le sort_order
          const { data: existingFiles } = await supabase
            .from('media_files')
            .select('sort_order')
            .eq('media_item_id', id)
            .order('sort_order', { ascending: false })
            .limit(1);

          const startOrder = existingFiles && existingFiles.length > 0 
            ? existingFiles[0].sort_order + 1 
            : 0;

          if (files.length > 0) {
            const mediaFiles = files.map((file: any, index: number) => ({
              media_item_id: id,
              file_name: file.file_name,
              file_path: file.file_path,
              file_type: file.file_type,
              file_size: file.file_size,
              mime_type: file.mime_type,
              alt_text: file.alt_text,
              sort_order: startOrder + index
            }));

            const { error: filesError } = await supabase
              .from('media_files')
              .insert(mediaFiles);

            if (filesError) throw filesError;
          }
        }

        result = updateData;
        message = 'Média mis à jour avec succès';
        break;

      case 'delete':
        if (!id) throw new Error("ID requis");
        
        const { error: deleteError } = await supabase
          .from('media_items')
          .delete()
          .eq('id', id);
        
        if (deleteError) throw deleteError;
        message = 'Média supprimé avec succès';
        break;

      default:
        throw new Error("Action non supportée");
    }

    return new Response(
      JSON.stringify({ message, data: result }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Error in manage-media function:', error);
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