import type { Metadata } from "next";
import { Geist, Geist_Mono, Work_Sans } from "next/font/google";
import { AuthProvider } from "@/lib/auth/context-new";
import { QueryProvider } from "@/lib/providers/query-provider";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin", "latin-ext"],
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${workSans.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
