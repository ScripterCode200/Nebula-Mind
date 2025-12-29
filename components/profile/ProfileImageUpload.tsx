"use client";

import React, { useState, useRef } from "react";
import { upload } from "@imagekit/next";
import { Camera, Loader2, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface ProfileImageUploadProps {
    initialImage?: string;
    onSuccess?: (url: string, fileId: string) => void;
}

const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
const authenticationEndpoint = "/api/imagekit-auth";

export default function ProfileImageUpload({ initialImage, onSuccess }: ProfileImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState(initialImage);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (e.g., 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File is too large. Max size is 5MB.");
            return;
        }

        setIsUploading(true);
        const toastId = toast.loading("Uploading your profile picture...");

        try {
            // 1. Get Authentication Parameters
            const authRes = await fetch(authenticationEndpoint);
            const authData = await authRes.json();

            if (authData.error) throw new Error(authData.error);

            // 2. Perform Upload
            const uploadResponse = await upload({
                file,
                fileName: `profile-${Date.now()}`,
                publicKey: publicKey!,
                signature: authData.signature,
                token: authData.token,
                expire: authData.expire,
                useUniqueFileName: true,
                folder: "/profile-pictures"
            });

            console.log("Upload Success:", uploadResponse);
            const newUrl = uploadResponse.url as string;
            const fileId = uploadResponse.fileId as string;

            setPreview(newUrl);

            // 3. Sync with Backend
            const syncRes = await fetch('/api/user/profile-image', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileImage: newUrl, imageKitFileId: fileId })
            });

            if (!syncRes.ok) throw new Error("Failed to sync with database");

            // 4. Handle Success
            if (onSuccess) {
                onSuccess(newUrl, fileId);
            }

            toast.success("Profile image updated successfully!", { id: toastId });
        } catch (err: any) {
            console.error("Upload/Sync Error:", err);
            toast.error(err.message || "Failed to upload image. Please try again.", { id: toastId });
        } finally {
            setIsUploading(false);
            // Reset file input
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div
                onClick={!isUploading ? triggerUpload : undefined}
                className="relative group overflow-hidden rounded-full w-32 h-32 border-2 border-white/10 glass-panel flex items-center justify-center cursor-pointer"
            >
                {preview ? (
                    <Image
                        src={preview!}
                        alt="Profile Preview"
                        fill
                        className="object-cover"
                        sizes="128px"
                        priority
                    />
                ) : (
                    <UserIcon className="w-12 h-12 text-muted-foreground" />
                )}

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="text-white w-8 h-8" />
                </div>

                {isUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                />
            </div>
            <p className="text-xs text-muted-foreground text-center">
                JPG, PNG or WebP. Max 5MB.
            </p>
        </div>
    );
}
