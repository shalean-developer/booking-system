import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shalean - Professional Cleaning Services",
  description: "Book professional cleaning services online. Standard, deep cleaning, move in/out, and Airbnb services.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "min-h-screen bg-slate-50")}>
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}

