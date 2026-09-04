import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "sukihouse",
  description: "A black-ground travel zine in three movements: The Rise, The Bloom, and The Summer.",
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
