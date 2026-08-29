import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppPreloader } from "@/components/ui/AppPreloader";

const sansFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const displayFont = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700", "800", "900"],
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: "#2563EB",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://alignview-3d.vercel.app"),
  title: {
    default: "AlignView 3D — Next-Gen 3D Dental STL Previewer & Aligner Simulator",
    template: "%s | AlignView 3D",
  },
  description:
    "Web-based 3D dental STL previewer & clear aligner treatment progression simulator. Continuous multi-stage orthodontic morphing, sub-millimeter caliper measurements, and multi-shader diagnostics in your browser.",
  keywords: [
    "3D dental STL viewer",
    "clear aligner simulation",
    "orthodontic 3D modeler",
    "dental CAD viewer",
    "Three.js dental",
    "WebGL STL previewer",
    "orthodontic treatment staging",
    "dental caliper measurement",
    "open source dental software",
    "dental scan viewer",
    "orthodontic tooth movement",
    "STL teeth previewer",
  ],
  authors: [
    {
      name: "MidCell Studios",
      url: "https://alignview-3d.vercel.app",
    },
  ],
  creator: "MidCell Studios",
  publisher: "MidCell Studios",
  applicationName: "AlignView 3D",
  category: "Medical / Dental Technology",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AlignView 3D — Next-Gen 3D Dental STL Previewer & Aligner Simulator",
    description:
      "Inspect clinical STL arches, simulate continuous multi-stage orthodontic treatment trajectories, and perform sub-millimeter measurements directly in your browser with zero installation.",
    url: "https://alignview-3d.vercel.app",
    siteName: "AlignView 3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AlignView 3D — Precision 3D Dental Modeling",
    description:
      "Inspect clinical STL arches and simulate continuous multi-stage clear aligner treatments in real-time WebGL.",
    creator: "@MidCellStudios",
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
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

// JSON-LD Structured Data Schema for Search Engines
const jsonLdSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "AlignView 3D",
      "applicationCategory": "HealthApplication",
      "operatingSystem": "Web Browser (Chrome, Firefox, Safari, Edge)",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
      },
      "description":
        "Next-generation 3D dental STL previewer and clear aligner treatment progression simulator with real-time WebGL rendering.",
      "softwareVersion": "1.0.0",
      "author": {
        "@type": "Organization",
        "name": "MidCell Studios",
        "url": "https://alignview-3d.vercel.app",
      },
    },
    {
      "@type": "WebSite",
      "name": "AlignView 3D",
      "url": "https://alignview-3d.vercel.app",
      "description": "Precision 3D Dental Modeling at the Speed of Web.",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
        />
      </head>
      <body className={`${sansFont.variable} ${displayFont.variable} ${monoFont.variable} font-sans antialiased min-h-screen bg-[#F4F6FA] text-slate-800 selection:bg-blue-600 selection:text-white`}>
        {/* Animated App Preloader with Brand Logo */}
        <AppPreloader />
        {children}
      </body>
    </html>
  );
}
