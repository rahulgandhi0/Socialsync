import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export async function uploadImageToSupabase(file: File): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('instagram-images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('instagram-images')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

export async function deleteImageFromSupabase(url: string): Promise<void> {
  try {
    // Extract file path from URL
    const filePath = url.split('/').pop();
    if (!filePath) throw new Error('Invalid file URL');

    const { error } = await supabase.storage
      .from('instagram-images')
      .remove([`uploads/${filePath}`]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
} 