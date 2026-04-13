import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "trackio terms of service — the agreement governing your use of our platform.",
  alternates: { canonical: "/terms-of-service" },
};

export default function TermsOfServicePage() {
  const lastUpdated = "9 April 2026";
  const companyName = "trackio";
  const contactEmail = "support@trackio.com.au";

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/login"><Logo size={36} /></Link>
        </div>

        <h1 className="text-3xl font-bold text-shark-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-shark-400 mb-8">Last updated: {lastUpdated}</p>

        <div className="prose prose-shark max-w-none space-y-6 text-sm text-shark-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-shark-900 mt-8 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using the {companyName} platform (&quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you are using the Service on behalf of an organisation, you represent that you have the authority to bind that organisation to these Terms. If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-shark-900 mt-8 mb-3">2. Description of Service</h2>
            <p>{companyName} provides a cloud-based asset and consumable tracking platform for businesses with distributed teams. The Service includes inventory management, staff equipment assignment, purchase order tracking, condition reporting, and related features.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-shark-900 mt-8 mb-3">3. Account Responsibilities</h2>
            <ul className="list-disc ml-6 space-y-1 mt-2">
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You must notify us immediately of any unauthorised access to your account.</li>
              <li>You are responsible for all activities under your account.</li>
              <li>You must provide accurate and complete information when creating accounts.</li>
              <li>Super Administrators are responsible for managing user access within their organisation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-shark-900 mt-8 mb-3">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc ml-6 space-y-1 mt-2">
              <li>Use the Service for any unlawful purpose or in violation of any applicable laws.</li>
              <li>Attempt to gain unauthorised access to any part of the Service.</li>
              <li>Interfere with or disrupt the integrity or performance of the Service.</li>
              <li>Upload malicious code, viruses, or other harmful content.</li>
              <li>Use the Service to store or transmit content that infringes any intellectual property rights.</li>
              <li>Share your account credentials with unauthorised individuals.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-shark-900 mt-8 mb-3">5. Data Ownership</h2>
            <p>You retain all rights to data you upload to the Service. {companyName} does not claim ownership of your content. We process your data solely to provide the Service as described in our <Link href="/privacy-policy" className="text-action-500 hover:underline">Privacy Policy</Link>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-shark-900 mt-8 mb-3">6. Service Availability</h2>
            <p>We aim to maintain 99.9% uptime but do not guarantee uninterrupted access. We may perform scheduled maintenance with reasonable notice. We are not liable for any downtime, data loss, or service interruptions beyond our reasonable control.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-shark-900 mt-8 mb-3">7. Subscription and Payment</h2>
            <ul className="list-disc ml-6 space-y-1 mt-2">
              <li>Subscription fees are billed in advance on a monthly or annual basis.</li>
              <li>All fees are non-refundable unless required by Australian Consumer Law.</li>
              <li>We reserve the right to change pricing with 30 days&apos; notice.</li>
              <li>Failure to pay may result in suspension or termination of your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-shark-900 mt-8 mb-3">8. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, {companyName} shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities. Our total liability shall not exceed the amount paid by you in the 12 months preceding the claim.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-shark-900 mt-8 mb-3">9. Termination</h2>
            <p>Either party may terminate the agreement at any time. Upon termination:</p>
            <ul className="list-disc ml-6 space-y-1 mt-2">
              <li>You may request an export of your data within 30 days.</li>
              <li>After 30 days, your data will be permanently deleted.</li>
              <li>Any outstanding fees remain payable.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-shark-900 mt-8 mb-3">10. Changes to Terms</h2>
            <p>We may update these Terms from time to time. Material changes will be communicated via email or in-app notification at least 14 days before they take effect. Continued use of the Service after changes constitute acceptance of the new Terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-shark-900 mt-8 mb-3">11. Governing Law</h2>
            <p>These Terms are governed by the laws of Australia. Any disputes shall be resolved in the courts of New South Wales, Australia.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-shark-900 mt-8 mb-3">12. Contact</h2>
            <p>For questions about these Terms, contact us at <a href={`mailto:${contactEmail}`} className="text-action-500 hover:underline">{contactEmail}</a>.</p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-shark-100 flex items-center justify-between text-xs text-shark-400">
          <p>&copy; {new Date().getFullYear()} {companyName}. All rights reserved.</p>
          <Link href="/privacy-policy" className="hover:text-action-500 transition-colors">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
