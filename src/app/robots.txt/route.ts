export function GET() {
  const content = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /api/",
    "Allow: /api/image/",
    "",
    "Sitemap: https://www.amargem.com.br/sitemap.xml",
  ].join("\n");

  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
