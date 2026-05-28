// app/layout.tsx 
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UCCP Iligan",
  description: "Church Membership Directory",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}