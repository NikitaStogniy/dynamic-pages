import type { Metadata } from "next";
import { Geist, Geist_Mono, Lora } from "next/font/google";
import { AuthProvider } from "@/lib/auth/context-new";
import { QueryProvider } from "@/lib/providers/query-provider";
import { ThemeProvider } from "@/lib/providers/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Dynamic Pages - Create and Share Interactive Content",
    template: "%s | Dynamic Pages",
  },
  description: "Create beautiful, interactive pages with our block-based editor. Share your content with custom URLs and QR codes.",
  keywords: ["page builder", "content creator", "editor", "qr codes", "dynamic pages"],
  authors: [{ name: "Dynamic Pages Team" }],
  creator: "Dynamic Pages",
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Dynamic Pages - Create and Share Interactive Content",
    description: "Create beautiful, interactive pages with our block-based editor.",
    siteName: "Dynamic Pages",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dynamic Pages",
    description: "Create beautiful, interactive pages with our block-based editor.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} antialiased`}
      >
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
