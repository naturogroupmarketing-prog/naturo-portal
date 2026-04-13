import { Navbar } from "@/components/marketing/navbar";
import { HeroSection } from "@/components/marketing/hero-section";
import { SocialProofSection } from "@/components/marketing/social-proof-section";
import { ValueSection } from "@/components/marketing/value-section";
import { UseCasesSection } from "@/components/marketing/use-cases-section";
import { ShowcaseSection } from "@/components/marketing/showcase-section";
import { ProductPreviewSection } from "@/components/marketing/product-preview-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { BenefitsSection } from "@/components/marketing/benefits-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FAQSection } from "@/components/marketing/faq-section";
import { ResourcesSection } from "@/components/marketing/resources-section";
import { CTASection } from "@/components/marketing/cta-section";
import { Footer } from "@/components/marketing/footer";
import { AIChatWidget } from "@/components/marketing/ai-chat-widget";
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
        {/* 1. Attention — Hook with headline + dashboard showcase */}
        <HeroSection />
        {/* 2. Proof — Social proof, stats, testimonials, trust badges */}
        <SocialProofSection />
        {/* 3. Pain — Identify the problem so visitors feel understood */}
        <ValueSection />
        {/* 4. Identity — "This is for people like me" */}
        <UseCasesSection />
        {/* 5. Simplicity — Interactive showcase with auto-cycling steps */}
        <ShowcaseSection />
        {/* 6. Desire — Product preview creates "I want this" */}
        <ProductPreviewSection />
        {/* 7. Capability — Full feature breakdown */}
        <FeaturesSection />
        {/* 8. Outcomes — Quantified results that matter */}
        <BenefitsSection />
        {/* 9. Decision — Pricing with annual/monthly toggle */}
        <PricingSection />
        {/* 10. Objections — FAQ handles remaining doubts */}
        <FAQSection />
        {/* 11. Resources — Swyftx-style illustrated cards */}
        <ResourcesSection />
        {/* 12. Action — Final CTA with urgency */}
        <CTASection />
      </main>
      <Footer />
      <AIChatWidget />
    </div>
  );
}
