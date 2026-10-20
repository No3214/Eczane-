import type { Metadata, Viewport } from "next";
import "./fonts.css";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#060807",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Nöbetçi+ | Reklamsız Nöbetçi Eczane Bulucu",
  description: "Liste içinde kaybolmadan, konumunuza en yakın nöbetçi eczaneleri saniyeler içinde bulun. Tek dokunuşla yol tarifi alın, arayın veya WhatsApp'tan yazın.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nöbetçi+",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className="h-full antialiased dark"
    >
      <head>
        <link
          rel="preload"
          href="/fonts/geist/geist-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/geist/geist-mono-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
