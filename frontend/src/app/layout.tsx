import { AuthInitializer } from "@/components/AuthInitializer";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
// Amplify設定を確実に読み込む
import "@/lib/amplify-config";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LegalFlow3",
  description: "法律事務所向けケース管理システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <QueryProvider>
          <AuthInitializer />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
