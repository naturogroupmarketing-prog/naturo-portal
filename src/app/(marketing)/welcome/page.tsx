import { Navbar } from "@/components/marketing/navbar";
import { HeroSection } from "@/components/marketing/hero-section";
import { SocialProofSection } from "@/components/marketing/social-proof-section";
import { ValueSection } from "@/components/marketing/value-section";
import { UseCasesSection } from "@/components/marketing/use-cases-section";
import { ShowcaseSection } from "@/components/marketing/showcase-section";
import { ProductPreviewSection } from "@/components/marketing/product-preview-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { BentoShowcaseSection } from "@/components/marketing/bento-showcase-section";
import { BenefitsSection } from "@/components/marketing/benefits-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FAQSection } from "@/components/marketing/faq-section";
import { ResourcesSection } from "@/components/marketing/resources-section";
import { SignupBanner } from "@/components/marketing/signup-banner";
import { CTASection } from "@/components/marketing/cta-section";
import { Footer } from "@/components/marketing/footer";
import { AIChatWidget } from "@/components/marketing/ai-chat-widget";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Asset & Supply Tracking Software for Operational Teams",
  description:
    "Track equipment, manage supplies, and keep every location accountable. trackio is the all-in-one asset and consumable tracking platform trusted by 500+ teams across Australia.",
  alternates: { canonical: "https://trackio.au/" },
  openGraph: {
    title: "trackio — Asset & Supply Tracking Software",
    description: "Track equipment, manage supplies, and keep every location accountable. Trusted by 500+ operational teams.",
    url: "https://trackio.au/",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "trackio",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: "All-in-one asset and consumable tracking platform for operational teams. Track equipment, manage supplies, and keep every location accountable.",
  url: "https://trackio.au/",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "AUD",
    lowPrice: "0",
    highPrice: "79",
    offerCount: "4",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "127",
    bestRating: "5",
  },
  publisher: {
    "@type": "Organization",
    name: "trackio",
    url: "https://trackio.au",
    logo: "https://trackio.au/trackio_t_full_logo.svg",
  },
};

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main>
        {/* 1. Attention — Hook with headline + dashboard showcase */}
        <HeroSection />
        {/* 2. Proof — Social proof, stats, testimonials, trust badges */}
        <SocialProofSection />
        {/* 3. Capability — Bento grid showcase */}
        <BentoShowcaseSection />
        {/* 4. Pain — Identify the problem so visitors feel understood */}
        <ValueSection />
        {/* 5. Identity — "This is for people like me" */}
        <UseCasesSection />
        {/* 6. Simplicity — Interactive showcase with auto-cycling steps */}
        <ShowcaseSection />
        {/* 7. Desire — Product preview creates "I want this" */}
        <ProductPreviewSection />
        {/* 8. Capability — Full feature breakdown */}
        <FeaturesSection />
        {/* 8. Outcomes — Quantified results that matter */}
        <BenefitsSection />
        {/* 8.5. Conversion — Vibrant gradient signup banner */}
        <SignupBanner />
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
