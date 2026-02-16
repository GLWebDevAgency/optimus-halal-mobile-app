# Sprint 12: Cloudflare R2 Image Hosting — Design + Implementation Plan

**Goal:** Replace local `file://` URIs with cloud-hosted images via Cloudflare R2. Presigned upload from mobile directly to R2, CDN delivery, zero Railway bandwidth for media.

**Why R2:** Zero egress fees, S3-compatible API, Cloudflare CDN included, ~$0.50/month at current scale.

---

## Architecture

```
Mobile (Expo)                    Railway (Hono/tRPC)            Cloudflare R2
    │                                 │                              │
    │ 1. getPresignedUrl({ type })    │                              │
    │────────────────────────────────>│                              │
    │                                 │ 2. PutObject presign         │
    │                                 │─────────────────────────────>│
    │   3. { uploadUrl, cdnUrl }      │                              │
    │<────────────────────────────────│                              │
    │                                 │                              │
    │ 4. PUT binary to R2 directly    │                              │
    │────────────────────────────────────────────────────────────────>│
    │                                 │                              │
    │ 5. updateProfile({ avatarUrl: cdnUrl })                        │
    │────────────────────────────────>│                              │
    │                                 │                              │
    │ 6. GET image via CDN            │                              │
    │<───────────────────────────────────────────────────────────────│
```

**Key:** Mobile never sends binary data through Railway. Upload goes directly to R2 via presigned URL.

---

## Scope

| Feature | R2 Path | Max Size | Resize | Format |
|---------|---------|----------|--------|--------|
| User avatar | `avatars/{userId}/{uuid}.webp` | 2MB | 512x512 | JPEG/WebP |
| Report photos | `reports/{userId}/{uuid}.webp` | 5MB | 1200px wide | JPEG/WebP |

**Out of scope (no upload needed):**
- Product images → from OpenFoodFacts API
- Store images → from ETL imports
- Article covers → seeded/CMS-managed

---

## Backend Changes

### New files

1. **`backend/src/services/r2.service.ts`** — R2 client (S3-compatible), presigned URL generation, delete
2. **`backend/src/trpc/routers/upload.ts`** — `getPresignedUrl` + `deleteImage` procedures

### Modified files

3. **`backend/src/lib/env.ts`** — Add R2 env vars
4. **`backend/src/trpc/router.ts`** — Register upload router
5. **`backend/.env.example`** — Document R2 env vars

### R2 Service API

```typescript
// r2.service.ts
getPresignedUploadUrl(key: string, contentType: string, maxSize: number): Promise<string>
getPublicUrl(key: string): string
deleteObject(key: string): Promise<void>
```

### Upload Router API

```typescript
// upload.ts (protectedProcedure)
upload.getPresignedUrl({ type: "avatar" | "report", contentType: string })
  → { uploadUrl: string, cdnUrl: string, key: string }

upload.deleteImage({ key: string })
  → { success: true }
```

### Environment Variables

```env
R2_ACCOUNT_ID=           # Cloudflare account ID
R2_ACCESS_KEY_ID=        # R2 API token access key
R2_SECRET_ACCESS_KEY=    # R2 API token secret
R2_BUCKET_NAME=          # e.g., "optimus-halal-media"
R2_PUBLIC_DOMAIN=        # e.g., "media.optimushalal.com" or R2 public URL
```

---

## Mobile Changes

### New files

1. **`optimus-halal/src/hooks/useImageUpload.ts`** — Full upload flow hook

### Modified files

2. **`optimus-halal/app/settings/edit-profile.tsx`** — Avatar upload via R2
3. **`optimus-halal/app/report.tsx`** — Report photos upload via R2

### useImageUpload Hook API

```typescript
const { upload, isUploading, progress } = useImageUpload();

// Usage:
const cdnUrl = await upload({
  uri: "file:///...",
  type: "avatar",      // determines resize + path
});
// Returns CDN URL like "https://media.optimushalal.com/avatars/abc/def.webp"
```

### Client-side processing (before upload)

- **expo-image-manipulator**: Resize to target dimensions
- **Compress**: Quality 0.8 for avatars, 0.85 for reports
- **Format**: JPEG (WebP not universally supported by manipulator)

---

## Implementation Tasks

### Task 1: R2 Service + Environment
- Create `backend/src/services/r2.service.ts` with S3Client
- Update `backend/src/lib/env.ts` with R2 vars (optional with defaults)
- Update `backend/.env.example`
- Install `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`
- Verify: `npx tsc --noEmit`

### Task 2: Upload tRPC Router
- Create `backend/src/trpc/routers/upload.ts`
- Register in `backend/src/trpc/router.ts`
- Procedures: `getPresignedUrl`, `deleteImage`
- Verify: `npx tsc --noEmit`

### Task 3: useImageUpload Hook
- Create `optimus-halal/src/hooks/useImageUpload.ts`
- Install `expo-image-manipulator` if not present
- Handle: pick → resize → get presigned URL → PUT to R2 → return CDN URL
- Export from hooks barrel

### Task 4: Wire Edit Profile
- Update `edit-profile.tsx` to use `useImageUpload` for avatar
- On photo pick: resize → upload → set avatarUrl to CDN URL
- Show upload progress indicator
- Delete old avatar on successful new upload

### Task 5: Wire Report Screen
- Update `report.tsx` to upload photos via `useImageUpload`
- Remove the `photos.filter(p => p.startsWith("http"))` workaround
- Upload all photos before submitting report

### Task 6: Verify + Commit
- TypeScript: 0 errors both projects
- Manual test: avatar upload end-to-end
- Commit all changes

---

## Verification Checklist

- [ ] `cd backend && npx tsc --noEmit` → 0 errors
- [ ] `cd optimus-halal && npx tsc --noEmit` → 0 errors
- [ ] `trpc.upload.getPresignedUrl({ type: "avatar" })` → returns valid presigned URL
- [ ] Mobile: Edit profile → change photo → uploads to R2 → CDN URL in DB
- [ ] Mobile: Report → add photos → uploads to R2 → URLs sent with report
- [ ] Avatar displays from CDN URL after profile reload
