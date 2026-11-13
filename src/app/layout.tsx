import type { Metadata, Viewport } from "next";
import "./globals.css";

const description = "Learn your times tables one bass at a time. A free multiplication game for kids who love fishing.";

// Share previews need absolute image URLs; Vercel provides the production domain.
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Reel Math",
  description,
  openGraph: { title: "Reel Math", description, siteName: "Reel Math", type: "website" },
  twitter: { card: "summary_large_image", title: "Reel Math", description },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1c6e8c",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
