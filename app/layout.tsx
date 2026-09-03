import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "The Flowing Green",
  description: "A black-ground travel zine of water, gardens, public memory, and Kyoto street heat.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="siteShell">
          <Header />
          <div className="siteContent">{children}</div>
        </div>
      </body>
    </html>
  );
}
