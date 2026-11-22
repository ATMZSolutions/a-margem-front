import { afterEach, describe, expect, it, vi } from "vitest";
import { getRuntimeStorage } from "./storageRuntime";

describe("getRuntimeStorage", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("confere o bucket pelo limite de upload mesmo quando a configuração geral é maior", () => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_STORAGE_SECRET_KEY", `sb_secret_${"x".repeat(20)}`);
    vi.stubEnv("SUPABASE_STORAGE_BUCKET", "site-publico");
    vi.stubEnv("SUPABASE_STORAGE_MAX_FILE_SIZE_BYTES", String(6 * 1024 * 1024));
    vi.stubEnv("SUPABASE_STORAGE_ALLOWED_MIME_TYPES", "image/jpeg,image/png,image/webp");

    expect(getRuntimeStorage()?.bucketConfig.maxFileSizeBytes).toBe(5 * 1024 * 1024);
  });
});
