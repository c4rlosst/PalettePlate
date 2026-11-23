import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
const nunito = Nunito({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FBFAF2",
};
export const metadata: Metadata = {
  title: {
    default: "PalettePlate — A little color, every day",
    template: "%s | PalettePlate",
  },
  description:
    "Explore familiar Filipino foods, log your meals, and discover more color at your own pace.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={nunito.variable}>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
