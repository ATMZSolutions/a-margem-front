export function GET() {
  const content = `
User-agent: *
Allow: /

Sitemap: https://www.amargem.com.br/sitemap.xml
`;

  return new Response(content.trim(), {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
