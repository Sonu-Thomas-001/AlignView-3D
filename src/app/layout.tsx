import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AlignView 3D - Dental Aligner & STL Previewer",
  description: "High-performance 3D Dental STL previewer, clear aligner treatment progression simulator, and orthodontic analysis tool.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#F4F6FA] text-slate-800 selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
