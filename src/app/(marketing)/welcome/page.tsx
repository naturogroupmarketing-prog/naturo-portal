import { Navbar } from "@/components/marketing/navbar";
import { HeroSection } from "@/components/marketing/hero-section";
import { ValueSection } from "@/components/marketing/value-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { ProductPreviewSection } from "@/components/marketing/product-preview-section";
import { UseCasesSection } from "@/components/marketing/use-cases-section";
import { BenefitsSection } from "@/components/marketing/benefits-section";
import { CTASection } from "@/components/marketing/cta-section";
import { Footer } from "@/components/marketing/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trackio - Asset & Supply Tracking for Operational Teams",
  description:
    "Track equipment, manage supplies, and keep every location accountable. One clear system for assets and consumables across all your branches.",
};

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <HeroSection />
        <ValueSection />
        <FeaturesSection />
        <HowItWorksSection />
        <ProductPreviewSection />
        <UseCasesSection />
        <BenefitsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
