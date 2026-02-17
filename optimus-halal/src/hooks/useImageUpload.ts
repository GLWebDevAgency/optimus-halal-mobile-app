/**
 * useImageUpload — Upload images to Cloudflare R2 via presigned URLs
 *
 * Flow: pick → resize → getPresignedUrl (tRPC) → PUT binary to R2 → return CDN URL
 * Uses a ref counter so concurrent uploads (report photos) are tracked correctly.
 *
 * expo-image-manipulator is lazy-loaded to avoid crashing screens that import
 * this hook before a dev-client rebuild includes the native module.
 */

import { useState, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";

type UploadType = "avatar" | "report";

interface UploadOptions {
  uri: string;
  type: UploadType;
}

const RESIZE_CONFIG = {
  avatar: { width: 512, height: 512 },
  report: { width: 1200 },
} as const;

/** PUT a blob to a presigned URL using XMLHttpRequest (more reliable than fetch for binary in RN) */
function putBlobToPresignedUrl(
  url: string,
  blob: Blob,
  contentType: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload échoué: ${xhr.status} ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => reject(new Error("Erreur réseau lors de l'upload"));
    xhr.ontimeout = () => reject(new Error("Upload timeout"));
    xhr.timeout = 30_000;
    xhr.send(blob);
  });
}

export function useImageUpload() {
  const activeUploads = useRef(0);
  const [isUploading, setIsUploading] = useState(false);
  const getPresignedUrl = trpc.upload.getPresignedUrl.useMutation();

  const upload = useCallback(
    async ({ uri, type }: UploadOptions): Promise<string> => {
      activeUploads.current += 1;
      setIsUploading(true);
      try {
        // Lazy-load to avoid crash when native module isn't in current dev client
        const { manipulateAsync, SaveFormat } = require("expo-image-manipulator");

        // 1. Resize + compress client-side
        const result = await manipulateAsync(
          uri,
          [{ resize: RESIZE_CONFIG[type] }],
          {
            format: SaveFormat.WEBP,
            compress: type === "avatar" ? 0.8 : 0.85,
          },
        );

        // 2. Get presigned URL from backend
        const { uploadUrl, cdnUrl } = await getPresignedUrl.mutateAsync({
          type,
          contentType: "image/webp",
        });

        // 3. Read resized file as blob
        const fileResponse = await fetch(result.uri);
        const blob = await fileResponse.blob();

        // 4. PUT directly to R2 via XHR (fetch blob body is unreliable in RN)
        await putBlobToPresignedUrl(uploadUrl, blob, "image/webp");

        return cdnUrl;
      } finally {
        activeUploads.current -= 1;
        if (activeUploads.current === 0) {
          setIsUploading(false);
        }
      }
    },
    [getPresignedUrl],
  );

  return { upload, isUploading };
}
