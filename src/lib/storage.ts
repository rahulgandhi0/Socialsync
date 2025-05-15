import { StorageError } from '@supabase/storage-js';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';

interface SupabaseStorageResponse {
  publicUrl: string;
}

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
    const { data } = supabase.storage
      .from('instagram-images')
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded file');
    }

    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    if (error instanceof StorageError) {
      throw new Error(`Storage error: ${error.message}`);
    }
    throw new Error('Failed to upload image to storage');
  }
}

export async function deleteImageFromSupabase(url: string): Promise<void> {
  try {
    // Extract file path from URL
    const filePath = url.split('/').pop();
    if (!filePath) {
      throw new Error('Invalid file URL');
    }

    const { error } = await supabase.storage
      .from('instagram-images')
      .remove([`uploads/${filePath}`]);

    if (error) {
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    if (error instanceof StorageError) {
      throw new Error(`Storage error: ${error.message}`);
    }
    throw new Error('Failed to delete image from storage');
  }
} 