import "./globals.css";
import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import { SiteTextProvider } from "@/components/SiteTextProvider";
import { getPublicSiteIdentity, getPublicTransversalSettings, listPublicNavigation, PALETAS_SITE } from "@/lib/siteContent";
import { getPageMetadata } from "@/lib/siteMetadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const identidade = await getPublicSiteIdentity();
  const siteUrl = identidade.dominio;
  const page = await getPageMetadata("/", identidade.tituloPadrao, identidade.descricaoPadrao);
  const titulo = typeof page.title === "string" ? page.title : identidade.tituloPadrao;
  const descricao = page.description ?? identidade.descricaoPadrao;
  return {
    ...page,
    metadataBase: new URL(siteUrl),
    title: { default: titulo, template: `%s | ${identidade.nomePublico}` },
    description: descricao,
    keywords: identidade.palavrasChave,
    authors: [{ name: identidade.autor }],
    openGraph: {
      ...page.openGraph,
      title: page.openGraph && "title" in page.openGraph ? String(page.openGraph.title) : titulo,
      description: descricao,
      url: siteUrl.replace(/\/$/, ""),
      siteName: identidade.nomePublico,
      locale: "pt_BR",
      type: "website",
    },
    twitter: { ...page.twitter, card: "summary_large_image", title: titulo, description: descricao },
    icons: { icon: identidade.favicon.url ?? "/favicon.ico" },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [identidade, navegacao, transversal] = await Promise.all([getPublicSiteIdentity(), listPublicNavigation(), getPublicTransversalSettings()]);
  const paleta = PALETAS_SITE[transversal.paleta];
  const fundo = transversal.fundo === "nenhum" ? "none" : `url('/${transversal.fundo}')`;
  const siteStyle = {
    "--site-background": paleta.fundo,
    "--site-foreground": paleta.texto,
    "--site-accent": paleta.acento,
    "--site-primary": paleta.primario,
    "--site-background-image": fundo,
  } as CSSProperties;
  return (
    <html lang="pt-BR">
      <body className="w-full min-h-screen bg-site-background text-site-foreground" data-site-font={transversal.tipografia} style={siteStyle}>
        <Sidebar items={navegacao} logoUrl={identidade.logo.url ?? "/logo-branca.png"} logoAlt={identidade.logo.alt || `Logo ${identidade.nomePublico}`} logoHref={identidade.destinoLogo} nomePublico={identidade.nomePublico} />
        <main><SiteTextProvider textos={transversal.textos}>{children}</SiteTextProvider></main>
        <Footer textoCopyright={identidade.textoCopyright} textoDireitos={identidade.textoDireitos} />
      </body>
    </html>
  );
}
