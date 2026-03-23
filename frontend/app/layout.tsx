import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grabr",
  description: "Paste a link. Get the file.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-white antialiased">{children}</body>
    </html>
  );
}
