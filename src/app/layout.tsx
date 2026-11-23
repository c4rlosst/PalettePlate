import type { Metadata, Viewport } from "next";
import "./globals.css";
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F7F8F2",
};
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
