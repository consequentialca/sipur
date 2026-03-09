import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sipur — your story told",
  description: "bedtime stories with meaningful life lessons — designed by you.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
