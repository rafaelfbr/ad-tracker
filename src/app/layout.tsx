import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Inicializar cron jobs no servidor
if (typeof window === "undefined") {
  import("@/lib/cron").then(({ initCronJobs }) => {
    initCronJobs();
  });
}

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ad Tracker — Espionagem de Anúncios",
  description:
    "Monitore anúncios na Biblioteca de Anúncios do Meta. Acompanhe a evolução de campanhas dos seus concorrentes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
