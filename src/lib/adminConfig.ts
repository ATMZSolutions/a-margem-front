export interface AdminConfig {
  username: string;
  password: string;
  jwtSecret: string;
}

export function getAdminConfig(): AdminConfig {
  const username = process.env.ADMIN_USER?.trim();
  const password = process.env.ADMIN_PASS;
  const jwtSecret = process.env.JWT_SECRET;

  if (!username || !password || !jwtSecret) {
    throw new Error("ADMIN_USER, ADMIN_PASS e JWT_SECRET precisam estar configurados.");
  }
  if (password.length < 16 || password === username) {
    throw new Error("ADMIN_PASS precisa ter pelo menos 16 caracteres e ser diferente do usuário.");
  }
  if (new TextEncoder().encode(jwtSecret).byteLength < 32) {
    throw new Error("JWT_SECRET precisa ter pelo menos 32 bytes.");
  }

  return { username, password, jwtSecret };
}
