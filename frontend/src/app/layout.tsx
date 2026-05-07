import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "EduPulse — Sahyadri College of Engineering & Management",
  description:
    "A unified, modern college ecosystem merging LMS, SIS, Achievement Tracker, and Mentorship Portal — built for Sahyadri College of Engineering & Management, Mangalore.",
  keywords: [
    "EduPulse",
    "Sahyadri College",
    "LMS",
    "Student Portal",
    "Mentorship",
    "Engineering College",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jakarta.variable} ${jetbrains.variable}`}
    >
      <body className="font-body bg-background text-text-primary min-h-screen">
        {children}
      </body>
    </html>
  );
}
