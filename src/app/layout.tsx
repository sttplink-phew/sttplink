import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "STTP LINK",
  description: "광양항 기반 운송차주 커뮤니티",
  keywords: [
    "광양항",
    "운송차주",
    "컨테이너 운송",
    "화물운송",
    "운행일지",
    "터미널 정보",
    "STTP LINK",
  ],
  openGraph: {
    title: "STTP LINK",
    description: "광양항 기반 운송차주 커뮤니티",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans`}
      >
        {children}
      </body>
    </html>
  );
}