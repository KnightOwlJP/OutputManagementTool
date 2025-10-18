import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { HeroUIProvider } from "@heroui/react";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { ToastProvider } from "@/contexts/ToastContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import ToastContainer from "@/components/common/ToastContainer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Output Management Tool",
  description: "工程管理・BPMN編集・バージョン管理ツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${inter.variable} antialiased`}
      >
        <ErrorBoundary>
          <SettingsProvider>
            <ToastProvider>
              <HeroUIProvider>
                {children}
                <ToastContainer />
              </HeroUIProvider>
            </ToastProvider>
          </SettingsProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
