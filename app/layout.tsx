import type { Metadata } from "next"; import { Geist, Geist_Mono } from "next/font/google"; import "./globals.css"; import Script from "next/script";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], });

const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], });

export const metadata: Metadata = { title: "Integra OS", description: "Powered by Integra OS", };

export default function RootLayout({ children, }: Readonly<{ children: React.ReactNode; }>) { return ( <html lang="en"> <body className={geistSans.variable + " " + geistMono.variable + " antialiased"} > {children}

      <Script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/1.6.5/flowbite.min.js" strategy="afterInteractive" /> </body> </html> ); }