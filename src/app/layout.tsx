import type { Metadata, Viewport } from "next";
import "./globals.css";

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
    "Web-based 3D dental STL previewer & clear aligner treatment progression simulator. Continuous 32-stage orthodontic morphing, sub-millimeter caliper measurements, and multi-shader diagnostics in your browser.",
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
      name: "Sonu Thomas",
      url: "https://github.com/Sonu-Thomas-001",
    },
  ],
  creator: "Sonu Thomas",
  publisher: "AlignView 3D",
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
      "Inspect clinical STL arches, simulate continuous 32-stage orthodontic treatment trajectories, and perform sub-millimeter measurements directly in your browser with zero installation.",
    url: "https://alignview-3d.vercel.app",
    siteName: "AlignView 3D",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AlignView 3D — Precision 3D Dental Modeling",
    description:
      "Inspect clinical STL arches and simulate continuous 32-stage clear aligner treatments in real-time WebGL.",
    creator: "@SonuThomas",
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
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
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
        "@type": "Person",
        "name": "Sonu Thomas",
        "url": "https://github.com/Sonu-Thomas-001",
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
      <body className="antialiased min-h-screen bg-[#F4F6FA] text-slate-800 selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
