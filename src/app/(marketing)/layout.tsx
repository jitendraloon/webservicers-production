import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";

export const metadata: Metadata = {
  title: "Websites, SEO & Digital Marketing | WebServicers",
  description:
    "Build your online presence with website design, SEO, local listings and managed advertising. Explore services and plans from WebServicers.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-copilot-gradient min-h-screen antialiased">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
