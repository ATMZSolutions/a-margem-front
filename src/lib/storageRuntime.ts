import { criarAdaptadorStorage } from "../../scripts/conteudo/storage.mjs";

const MIMES_UPLOAD = ["image/jpeg", "image/png", "image/webp"];
const LIMITE_UPLOAD_BYTES = 5 * 1024 * 1024;

export function getRuntimeStorage() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_STORAGE_SECRET_KEY ?? process.env.SUPABASE_STORAGE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;
  const maxFileSizeBytes = Number(process.env.SUPABASE_STORAGE_MAX_FILE_SIZE_BYTES ?? 6 * 1024 * 1024);
  const allowedMimeTypes = (process.env.SUPABASE_STORAGE_ALLOWED_MIME_TYPES ?? MIMES_UPLOAD.join(","))
    .split(",").map((mime) => mime.trim()).filter(Boolean);

  if (!url || !serviceKey || !bucket || !Number.isSafeInteger(maxFileSizeBytes) || maxFileSizeBytes < LIMITE_UPLOAD_BYTES
    || MIMES_UPLOAD.some((mime) => !allowedMimeTypes.includes(mime))) return null;

  return {
    storage: criarAdaptadorStorage({ url, serviceKey, serviceRoleKey: serviceKey }),
    bucketConfig: { bucket, maxFileSizeBytes, allowedMimeTypes },
  };
}
