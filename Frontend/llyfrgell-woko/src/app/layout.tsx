import type {Metadata} from "next";
import localFont from "next/font/local";
import {Caveat} from "next/font/google";
import "./globals.css";
import Navbar from "./ui/navbar";
import Breadcrumbs from "./ui/breadcrumbs";
import {BreadcrumbProvider} from "./components/BreadcrumbContext";

import {getServerSession} from "next-auth";
import {authOptions} from "./utils/authOptions";
import SessionProvider from "./components/SessionProvider";
import GradioSpace from "./ui/gradioSpace";
import PersistStorage from "./components/PersistStorage";

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
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Ymarfer",
    },
};

export const viewport = {
    themeColor: "#b45309",
};

export default async function RootLayout({
                                             children,
                                         }: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await getServerSession(authOptions);

    return (
        <html lang="en">
        <head>
            <meta name="apple-mobile-web-app-capable" content="yes"/>
            <meta name="mobile-web-app-capable" content="yes"/>
        </head>
        <body
            className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable} antialiased`}
        >
        <SessionProvider session={session}>
            <BreadcrumbProvider>
                <PersistStorage/>
                <Navbar/>
                <GradioSpace/>
                <Breadcrumbs/>
                {children}
            </BreadcrumbProvider>
        </SessionProvider>
        </body>
        </html>
    );
}
