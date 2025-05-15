import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { uploadImageToSupabase, deleteImageFromSupabase } from '@/lib/storage';
import { Trash2, Upload } from 'react-feather';

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  onImageRemoved: () => void;
  currentImage?: string;
}

export default function ImageUpload({ onImageUploaded, onImageRemoved, currentImage }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentImage);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image size should be less than 8MB');
      return;
    }

    setIsUploading(true);
    try {
      // If there's an existing image, delete it first
      if (previewUrl) {
        await deleteImageFromSupabase(previewUrl);
      }

      // Upload new image
      const url = await uploadImageToSupabase(file);
      setPreviewUrl(url);
      onImageUploaded(url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  }, [previewUrl, onImageUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  const handleRemove = async () => {
    if (previewUrl) {
      try {
        await deleteImageFromSupabase(previewUrl);
        setPreviewUrl(undefined);
        onImageRemoved();
        toast.success('Image removed successfully');
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to remove image');
      }
    }
  };

  return (
    <div className="w-full">
      {!previewUrl ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-300 hover:border-indigo-500'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-3">
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
                <p className="text-sm text-gray-500">Uploading...</p>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 text-gray-400" />
                <p className="text-sm text-gray-500">
                  {isDragActive
                    ? 'Drop the image here'
                    : 'Drag & drop an image here, or click to select'}
                </p>
                <p className="text-xs text-gray-400">
                  Supports: JPG, PNG, GIF (max 8MB)
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-auto object-cover rounded-lg"
          />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
} 