import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { FramerProvider } from "@/components/providers/framer-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { MaintenanceBlocker } from "@/components/providers/maintenance-blocker";

import { PWAInstallPrompt } from "@/components/pwa-install-prompt";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});

export const viewport: Viewport = {
  themeColor: "#064e3b",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://surat.kemenag-baritoutara.com"),
  title: {
    default: "SI MANDAU | Kemenag Barito Utara",
    template: "%s | SI MANDAU",
  },
  description:
    "Portal resmi Sistem Informasi Manajemen Persuratan Elektronik (E-Surat) Kementerian Agama (Kemenag) Kabupaten Barito Utara. Masuk ke panel admin untuk mengelola administrasi persuratan.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SI MANDAU",
  },
  keywords: [
    "e-surat kemenag",
    "surat kemenag barito utara",
    "kementerian agama barito utara",
    "persuratan elektronik kemenag",
    "aplikasi surat kemenag",
    "si mandau kemenag",
    "sistem surat kemenag",
  ],
  authors: [{ name: "Kemenag Barito Utara" }],
  creator: "Kemenag Barito Utara",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://surat.kemenag-baritoutara.com",
    title: "SI MANDAU | Kemenag Barito Utara",
    description:
      "Portal resmi Sistem Informasi Manajemen Persuratan Elektronik Kementerian Agama Kabupaten Barito Utara.",
    siteName: "SI MANDAU Kemenag Barito Utara",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://surat.kemenag-baritoutara.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "SI MANDAU | Kemenag Barito Utara",
    description:
      "Portal resmi Sistem Informasi Manajemen Persuratan Elektronik (E-Surat) Kementerian Agama Kabupaten Barito Utara.",
    images: ["https://surat.kemenag-baritoutara.com/mandau.png"],
  },
  icons: {
    icon: "/mandau.png",
    shortcut: "/mandau.png",
    apple: "/mandau.png",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "GovernmentOrganization",
      "@id": "https://surat.kemenag-baritoutara.com/#organization",
      "name": "Kementerian Agama Kabupaten Barito Utara",
      "alternateName": "Kemenag Barito Utara",
      "url": "https://surat.kemenag-baritoutara.com",
      "logo": "https://surat.kemenag-baritoutara.com/mandau.png",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Muara Teweh",
        "addressRegion": "Kalimantan Tengah",
        "addressCountry": "ID"
      }
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://surat.kemenag-baritoutara.com/#application",
      "name": "SI MANDAU",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "All",
      "url": "https://surat.kemenag-baritoutara.com",
      "description": "Sistem Informasi Manajemen Persuratan Elektronik (E-Surat) Kementerian Agama Kabupaten Barito Utara."
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`h-full antialiased ${plusJakartaSans.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-slate-50 dark:bg-[#0f1117] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FramerProvider>{children}</FramerProvider>
          <Toaster position="top-right" richColors closeButton />
          <PWAInstallPrompt />
          <MaintenanceBlocker />
        </ThemeProvider>
      </body>
    </html>
  );
}
