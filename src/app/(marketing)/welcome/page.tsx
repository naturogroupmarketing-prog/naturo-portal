import { Navbar } from "@/components/marketing/navbar";
import { HeroSection } from "@/components/marketing/hero-section";
import { SwitcherBar } from "@/components/marketing/switcher-bar";
import { ValueSection } from "@/components/marketing/value-section";
import { UseCasesSection } from "@/components/marketing/use-cases-section";
import { ShowcaseSection } from "@/components/marketing/showcase-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { SocialProofSection } from "@/components/marketing/social-proof-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FAQSection } from "@/components/marketing/faq-section";
import { CTASection } from "@/components/marketing/cta-section";
import { Footer } from "@/components/marketing/footer";
import { AIChatWidget } from "@/components/marketing/ai-chat-widget";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Asset & Supply Tracking Software for Service Businesses | trackio",
  description:
    "Replace spreadsheets and clunky apps with trackio — the asset and supply tracking platform built for Australian service businesses. Know what you have, where it is, and who has it. Free 14-day trial.",
  alternates: { canonical: "https://trackio.au/" },
  openGraph: {
    title: "trackio — Stop Losing Equipment. Start Tracking Smarter.",
    description: "Replace spreadsheets and clunky apps with trackio. Built for Australian service businesses managing equipment and supplies across multiple locations.",
    url: "https://trackio.au/",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "trackio",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: "Asset and supply tracking platform for Australian service businesses. Replace spreadsheets and clunky apps with one simple system.",
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
        {/* 1. Hook — pain-first hero with email capture */}
        <HeroSection />
        {/* 2. Credibility — show what we replace */}
        <SwitcherBar />
        {/* 3. Pain agitation — cost of doing nothing */}
        <ValueSection />
        {/* 4. Identity — is this for me? */}
        <UseCasesSection />
        {/* 5. Solution — how it works */}
        <ShowcaseSection />
        {/* 6. Comparison — how we stack up */}
        <FeaturesSection />
        {/* 7. Trust — testimonials + stats */}
        <SocialProofSection />
        {/* 9. Decision — pricing */}
        <PricingSection />
        {/* 10. Objections — FAQ */}
        <FAQSection />
        {/* 11. Final conversion — email capture */}
        <CTASection />
      </main>
      <Footer />
      <AIChatWidget />
    </div>
  );
}
