import { supabase } from '@/lib/supabase';
import { convertImageToWebP, generateUniqueFileName, ConvertToWebPOptions } from './imageUtils';

/**
 * Upload de imagem para Supabase Storage com conversÃ£o automÃ¡tica para WebP
 */
export async function uploadImageToStorage(
  file: File,
  bucket: string,
  path?: string,
  convertOptions?: ConvertToWebPOptions
): Promise<{ url: string; path: string }> {
  try {
    // Converter para WebP
    const webpBlob = await convertImageToWebP(file, convertOptions);
    
    // Gerar nome Ãºnico se nÃ£o fornecido
    const fileName = path || generateUniqueFileName();
    
    // Upload para o Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, webpBlob, {
        contentType: 'image/webp',
        upsert: false,
      });

    if (error) {
      console.error('Erro no upload:', error);
      throw new Error(error.message || 'Erro desconhecido do Supabase Storage');
    }

    // Obter URL pÃºblica
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('uploadImageToStorage error:', error);
    throw error;
  }
}

/**
 * Upload de mÃºltiplas imagens
 */
export async function uploadMultipleImages(
  files: File[],
  bucket: string,
  pathPrefix?: string,
  convertOptions?: ConvertToWebPOptions
): Promise<Array<{ url: string; path: string }>> {
  const uploads = files.map((file, index) => {
    const path = pathPrefix 
      ? `${pathPrefix}/${generateUniqueFileName()}`
      : generateUniqueFileName();
    
    return uploadImageToStorage(file, bucket, path, convertOptions);
  });

  return Promise.all(uploads);
}

/**
 * Deleta uma imagem do Storage
 */
export async function deleteImageFromStorage(
  bucket: string,
  path: string
): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Erro ao deletar imagem:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('deleteImageFromStorage error:', error);
    return false;
  }
}

/**
 * Substitui uma imagem existente
 */
export async function replaceImageInStorage(
  file: File,
  bucket: string,
  oldPath: string,
  convertOptions?: ConvertToWebPOptions
): Promise<{ url: string; path: string }> {
  try {
    // Deletar imagem antiga
    await deleteImageFromStorage(bucket, oldPath);
    
    // Upload nova imagem com o mesmo path
    return uploadImageToStorage(file, bucket, oldPath, convertOptions);
  } catch (error) {
    console.error('replaceImageInStorage error:', error);
    throw error;
  }
}
