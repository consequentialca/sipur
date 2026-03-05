import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sipur — סיפור",
  description: "A Torah-guided bedtime story app for Jewish children",
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
