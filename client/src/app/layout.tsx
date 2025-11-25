import type { Metadata } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";
import Layout from "@/components/Layout";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });
const bebasNeue = Bebas_Neue({ 
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue"
});

export const metadata: Metadata = {
  title: "PedigreeBuilder - Dog Pedigrees",
  description: "A web tool for building and managing dog pedigrees",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${bebasNeue.variable}`}>
        <Layout>
          {children}
        </Layout>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  );
}