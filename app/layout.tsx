import { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Providers } from "./providers";
import Analytics from "@/components/Analytics";
import Script from "next/script";

const poppins = Poppins({ weight: "400", subsets: ["latin"] });

const _metadata = {
  title: "AnonQuote.xyz Feed",
  description: "AnonQuote.xyz Feed",
};

export const metadata: Metadata = {
  title: _metadata.title,
  description: _metadata.description,
  icons: {
    icon: "https://anonquote-feed.vercel.app/logo.png",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@apoorveth",
    title: _metadata.title,
    description: _metadata.description,
    images: "https://anonquote-feed.vercel.app/og/index.png",
  },
  openGraph: {
    type: "website",
    title: _metadata.title,
    description: _metadata.description,
    images: "https://anonquote-feed.vercel.app/og/index.png",
  },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={poppins.className} suppressHydrationWarning>
        <Analytics />
        <Providers>{children}</Providers>
        <Script id="handle-vsc-class" strategy="afterInteractive">
          {`
            if (document.body.classList.contains('vsc-initialized')) {
              document.body.classList.remove('vsc-initialized');
            }
          `}
        </Script>
      </body>
    </html>
  );
}
