"use client";

import { useState, useRef } from 'react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Camera, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface UploadPhotoProps {
  currentPhotoURL: string;
  onPhotoChange: (url: string) => void;
  userId: string;
}

export function UploadPhoto({ currentPhotoURL, onPhotoChange, userId }: UploadPhotoProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `profile-photos/${userId}/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      onPhotoChange(downloadURL);
      toast.success('Profile photo updated successfully');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div className="w-32 h-32 relative rounded-full overflow-hidden">
          <Image
            src={currentPhotoURL}
            alt="Profile"
            fill
            sizes="128px"
            className="object-cover"
            priority
          />
        </div>
        <button 
          className="absolute bottom-0 right-0 p-2 bg-blue-500 rounded-full text-white hover:bg-blue-600 transition-colors"
          onClick={triggerFileInput}
          disabled={uploading}
        >
          <Camera className="w-4 h-4" />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      <Button 
        onClick={triggerFileInput}
        disabled={uploading}
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          'Change Photo'
        )}
      </Button>
    </div>
  );
}