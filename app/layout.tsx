import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Biểu đồ Bitcoin",
  description: "Hiển thị biểu đồ giá Bitcoin với Next.js và Lightweight Charts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
          <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
