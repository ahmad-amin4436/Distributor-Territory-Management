import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { StoreBootstrap } from "@/services/storeBootstrap";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Distributor Territory Management",
  description:
    "Premium GIS dashboard for managing distributor sales territories on an interactive city map.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <StoreBootstrap>{children}</StoreBootstrap>
      </body>
    </html>
  );
}
