import { Playfair_Display, DM_Mono, Anton } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
});

const dmMono = DM_Mono({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
});

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
});

import Providers from "@/components/Providers";
import TransitionProvider from "@/components/TransitionProvider";

export const metadata = {
  title: "MSBT | Digital Operating System",
  description: "Mahalaxmi Samprat Behara Traders Enterprise Resource Planning",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050505",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${playfair.variable} ${dmMono.variable} ${anton.variable} antialiased`}>
      <body className="min-h-screen flex flex-col selection:bg-white selection:text-black overflow-x-hidden">
        <Providers>
          <TransitionProvider>
            {children}
          </TransitionProvider>
        </Providers>
      </body>
    </html>
  );
}
