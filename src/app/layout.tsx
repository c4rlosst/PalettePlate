import type { Metadata } from "next";
import "@fontsource/public-sans/400.css";
import "@fontsource/public-sans/500.css";
import "@fontsource/public-sans/600.css";
import "@fontsource/public-sans/700.css";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "PalettePlate — A little colour, every day",
    template: "%s | PalettePlate",
  },
  description:
    "Explore familiar Filipino foods, log your meals, and discover more colour at your own pace.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
