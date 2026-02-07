import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LenisProvider from "@/components/providers/LenisProvider";
import AudioProvider from "@/components/providers/AudioProvider";
import CustomCursor from "@/components/dom/CustomCursor";
import SoundToggle from "@/components/dom/SoundToggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LIQUID.LAB | Experimental Fluid",
  description: "A dynamic liquid rainbow iridescent experience.",
  icons: {
    icon: "/favicon.png",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <AudioProvider>
          <CustomCursor />
          <SoundToggle />
          <LenisProvider>
            {children}
          </LenisProvider>
        </AudioProvider>
      </body>
    </html>
  );
}
