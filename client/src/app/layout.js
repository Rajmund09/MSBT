import { Libre_Baskerville, DM_Mono, Anton } from "next/font/google";
import "./globals.css";

const libre = Libre_Baskerville({
  weight: ["400", "700"],
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-libre",
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

export const metadata = {
  title: "MSBT | Digital Operating System",
  description: "Mahalaxmi Samprat Behara Traders Enterprise Resource Planning",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${libre.variable} ${dmMono.variable} ${anton.variable} antialiased`}>
      <body className="min-h-screen flex flex-col selection:bg-white selection:text-black">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
