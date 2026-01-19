import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Providers } from "@/lib/providers";

const inter = Inter({ subsets: ["latin"] });
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-instrument-serif",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  title: {
    default: "Teach anything. - AI Chatbots for Education",
    template: "%s | Teach anything.",
  },
  description:
    "Create intelligent, context-aware AI chatbots powered by your course materials using advanced RAG (Retrieval-Augmented Generation). Support for multiple AI models including Llama 3.3, Mistral Large, and more.",
  keywords: [
    "AI chatbot",
    "education technology",
    "RAG",
    "retrieval-augmented generation",
    "course materials",
    "AI assistant",
    "educational AI",
    "chatbot platform",
    "OpenRouter",
    "Llama 3.3",
    "Mistral Large",
    "Qwen 2.5",
    "GPT-OSS",
  ],
  authors: [{ name: "Teach anything. Team" }],
  creator: "Teach anything.",
  publisher: "Teach anything.",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Teach anything.",
    title: "Teach anything. - AI Chatbots for Education",
    description:
      "Create intelligent, context-aware AI chatbots powered by your course materials using advanced RAG technology.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Teach anything. - AI Chatbots for Education",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Teach anything. - AI Chatbots for Education",
    description:
      "Create intelligent, context-aware AI chatbots powered by your course materials using advanced RAG technology.",
    images: ["/logo.png"],
    creator: "@teachanything",
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
  icons: {
    icon: [{ url: "/logo.svg", type: "image/svg+xml" }],
    apple: [{ url: "/logo.png", type: "image/png", sizes: "180x180" }],
    shortcut: "/logo.svg",
  },
  category: "education",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${instrumentSerif.variable}`}>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
