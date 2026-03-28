import type { Metadata } from "next";
import localFont from "next/font/local";
import { Caveat } from "next/font/google";
import "./globals.css";
import Navbar from "./ui/navbar";
import Breadcrumbs from "./ui/breadcrumbs";
import { BreadcrumbProvider } from "./components/BreadcrumbContext";

import { getServerSession } from "next-auth";
import SessionProvider from "./components/SessionProvider";
import GradioSpace from "./ui/gradioSpace";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
});

export const metadata: Metadata = {
  title: "Llyfrgell Woko",
  description: "Woko's personal library and portfolio",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable} antialiased`}
      >
        <SessionProvider session={session}>
          <BreadcrumbProvider>
            <Navbar />
            <GradioSpace />
            <Breadcrumbs />
            {children}
          </BreadcrumbProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
