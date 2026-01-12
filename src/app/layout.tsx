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
  title: "PostSpark - Free LinkedIn Post Ideas Generator | AI-Powered",
  description: "Get 10 personalized LinkedIn post ideas with viral hooks in seconds. Free AI tool that analyzes your profile and generates content ideas that match your expertise.",
  keywords: "LinkedIn post ideas, LinkedIn content generator, viral LinkedIn posts, LinkedIn hooks, AI content ideas, free LinkedIn tool",
  openGraph: {
    title: "PostSpark - Get 10 LinkedIn Post Ideas in Seconds (Free)",
    description: "AI analyzes your profile and generates personalized content ideas with proven viral hooks. 100% free.",
    url: "https://postspark.pro",
    siteName: "PostSpark",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PostSpark - Free LinkedIn Post Ideas Generator",
    description: "Get 10 personalized LinkedIn post ideas with viral hooks in seconds. 100% free.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://postspark.pro" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
