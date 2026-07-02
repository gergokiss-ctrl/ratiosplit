import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "RatioSplit",
  description: "Kétfős havi arányos költségelszámoló",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu">
      <body>{children}</body>
    </html>
  );
}
