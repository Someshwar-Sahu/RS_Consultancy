import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://rs-consultancy-seven.vercel.app"),
  title: {
    default: "RS Bridge Consultancy | Premier Recruitment & Staffing Solutions India",
    template: "%s | RS Bridge Consultancy",
  },
  description: "RS Bridge Consultancy is India's leading manpower staffing & talent acquisition platform connecting top candidates, drivers, and corporate professionals with elite employers.",
  keywords: [
    "RS Bridge Consultancy",
    "Recruitment Agency India",
    "Staffing Solutions Delhi NCR",
    "Driver Placement Agency",
    "Corporate Hiring ATS",
    "Manpower Consultancy",
    "Job Placement India",
  ],
  authors: [{ name: "RS Bridge Consultancy" }],
  creator: "RS Bridge Consultancy",
  publisher: "RS Bridge Consultancy",
  alternates: {
    canonical: "https://rs-consultancy-seven.vercel.app",
  },
  openGraph: {
    title: "RS Bridge Consultancy | Premier Recruitment & Staffing Solutions India",
    description: "Pan-India talent recruitment, corporate hiring, driver placements, and enterprise ATS staffing portal.",
    url: "https://rs-consultancy-seven.vercel.app",
    siteName: "RS Bridge Consultancy",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RS Bridge Consultancy | Manpower & Staffing Solutions",
    description: "Pan-India hiring and corporate staffing agency platform.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Navbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
