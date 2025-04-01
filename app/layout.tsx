// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // TailwindCSS base styles
import { ThemeProvider } from "@/components/Providers/ThemeProvider"; // Import provider

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
      {/* suppressHydrationWarning useful when using localStorage for theme */}
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          {" "}
          {/* Wrap children with ThemeProvider */}
          <main className="min-h-screen">{children}</main>
          {/* Footer or other global elements */}
        </ThemeProvider>
      </body>
    </html>
  );
}
