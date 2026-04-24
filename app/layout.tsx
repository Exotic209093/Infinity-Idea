import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Infinite Idea — Client Documentation Canvas",
  description:
    "Design beautiful, easy-to-follow client documentation and graphics on an infinite canvas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-canvas-wash text-white antialiased">
        {children}
      </body>
    </html>
  );
}
