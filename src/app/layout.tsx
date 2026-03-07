import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import AppShell from "@/components/app-shell";
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
        <ClerkProvider>
          <AppShell>
            {children}
          </AppShell>
          <Toaster richColors position="bottom-right" />
        </ClerkProvider>
      </body>
    </html>
  );
}
