import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Trackio privacy policy — how we collect, use, and protect your data.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "5 April 2026";
  const companyName = "Trackio";
  const contactEmail = "privacy@trackio.com.au";

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/login"><Logo size={36} /></Link>
        </div>

        <h1 className="text-3xl font-bold text-shark-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-shark-400 mb-8">Last updated: {lastUpdated}</p>

        <div className="prose prose-shark max-w-none space-y-6 text-sm text-shark-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-shark-900 mt-8 mb-3">1. About This Policy</h2>
            <p>{companyName} (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting the privacy of personal information in accordance with the Australian Privacy Act 1988 (Cth) and the 13 Australian Privacy Principles (APPs). This policy explains how we collect, use, disclose, and protect your personal information when you use our asset and consumable tracking platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-shark-900 mt-8 mb-3">2. Information We Collect (APP 3)</h2>
            <p>We collect the following personal information:</p>
            <ul className="list-disc ml-6 space-y-1 mt-2">
              <li><strong>Identity information:</strong> Full name</li>
              <li><strong>Contact information:</strong> Email address, phone number (optional)</li>
              <li><strong>Authentication data:</strong> Password (stored as a one-way cryptographic hash, never in plain text)</li>
              <li><strong>Profile data:</strong> Profile photo (optional), role, assigned region</li>
              <li><strong>Usage data:</strong> Asset assignments, consumable records, condition check photos, audit logs of actions taken within the platform</li>
              <li><strong>Technical data:</strong> Session tokens, login timestamps</li>
            </ul>
            <p className="mt-2">We only collect information that is reasonably necessary for our platform&apos;s functions. Your account is created by your organisation&apos;s administrator, not through self-registration.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-shark-900 mt-8 mb-3">3. How We Use Your Information (APP 6)</h2>
            <p>We use your personal information for the following purposes:</p>
            <ul className="list-disc ml-6 space-y-1 mt-2">
              <li>Authenticating your identity and managing your account</li>
              <li>Assigning and tracking assets and consumables to you</li>
              <li>Sending notifications about assignments, returns, low stock, and other platform events</li>
              <li>Providing AI-powered search and inventory management assistance</li>
              <li>Generating reports and audit trails for your organisation</li>
              <li>Processing subscription payments for your organisation</li>
            </ul>
            <p className="mt-2">We will not use your information for purposes other than those described above without your consent.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-shark-900 mt-8 mb-3">4. Third-Party Disclosure (APP 6 & 8)</h2>
            <p>We share limited information with the following service providers to operate the platform:</p>
            <ul className="list-disc ml-6 space-y-1 mt-2">
              <li><strong>Resend (US-based):</strong> Email delivery service. Receives your email address and name for sending notifications. <a href="https://resend.com/privacy" className="text-action-500 underline" target="_blank" rel="noopener noreferrer">Resend Privacy Policy</a></li>
              <li><strong>Stripe (US-based):</strong> Payment processing for organisation subscriptions. Receives organisation billing data only, not individual user data. <a href="https://stripe.com/privacy" className="text-action-500 underline" target="_blank" rel="noopener noreferrer">Stripe Privacy Policy</a></li>
              <li><strong>Anthropic (US-based):</strong> AI assistant functionality. Search queries and inventory data may be processed by Claude AI. No personal identification data is sent. <a href="https://www.anthropic.com/privacy" className="text-action-500 underline" target="_blank" rel="noopener noreferrer">Anthropic Privacy Policy</a></li>
              <li><strong>Google (US-based):</strong> Optional OAuth authentication. If you sign in with Google, your name, email, and profile photo are shared with Google. <a href="https://policies.google.com/privacy" className="text-action-500 underline" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a></li>
              <li><strong>Vercel (US-based):</strong> Application hosting. Technical request data (IP addresses, user agent) is processed by Vercel&apos;s infrastructure. <a href="https://vercel.com/legal/privacy-policy" className="text-action-500 underline" target="_blank" rel="noopener noreferrer">Vercel Privacy Policy</a></li>
            </ul>
            <p className="mt-3"><strong>Cross-border disclosure (APP 8):</strong> As noted above, some of our service providers are based in the United States. By using {companyName}, you consent to the transfer of limited data to these US-based providers. Your primary data (database) is stored in Australia (AWS ap-southeast-2, Sydney).</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-shark-900 mt-8 mb-3">5. Data Security (APP 11)</h2>
            <p>We take reasonable steps to protect your information from misuse, interference, loss, and unauthorised access, modification, or disclosure:</p>
            <ul className="list-disc ml-6 space-y-1 mt-2">
              <li>Passwords are hashed using bcrypt with 12 rounds (industry standard)</li>
              <li>All data transmitted over HTTPS (TLS encryption in transit)</li>
              <li>Role-based access control with granular permissions</li>
              <li>Rate limiting on authentication endpoints to prevent brute-force attacks</li>
              <li>Session tokens stored in HTTP-only secure cookies</li>
              <li>Database hosted in Australia with connection pooling and SSL</li>
              <li>Full audit trail of all system actions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-shark-900 mt-8 mb-3">6. Accessing and Correcting Your Information (APP 12 & 13)</h2>
            <p>You have the right to:</p>
            <ul className="list-disc ml-6 space-y-1 mt-2">
              <li><strong>Access your data:</strong> View your personal information via Settings, and download a copy of all your data.</li>
              <li><strong>Correct your data:</strong> Update your name, email, and phone number via Settings.</li>
              <li><strong>Delete your account:</strong> Request deletion of your account and associated data via Settings or by contacting your administrator.</li>
              <li><strong>Control notifications:</strong> Enable or disable email notifications via Settings.</li>
            </ul>
            <p className="mt-2">To make a formal data access or correction request, contact us at <a href={`mailto:${contactEmail}`} className="text-action-500 underline">{contactEmail}</a>. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-shark-900 mt-8 mb-3">7. Data Retention</h2>
            <p>We retain your personal information for as long as your account is active or as needed to provide services. When your account is deleted:</p>
            <ul className="list-disc ml-6 space-y-1 mt-2">
              <li>Your profile data (name, email, phone) is permanently deleted</li>
              <li>Asset assignments are returned and reassigned</li>
              <li>Audit logs are retained for 7 years for legal and compliance purposes (with anonymised references)</li>
              <li>Condition check photos are deleted with your account</li>
            </ul>
            <p className="mt-2">Inactive accounts may be deactivated by your organisation&apos;s administrator. You may request full data erasure by contacting <a href={`mailto:${contactEmail}`} className="text-action-500 underline">{contactEmail}</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-shark-900 mt-8 mb-3">8. Cookies</h2>
            <p>We use the following cookies:</p>
            <ul className="list-disc ml-6 space-y-1 mt-2">
              <li><strong>Session cookie</strong> (essential): Maintains your login session. Cannot be disabled.</li>
              <li><strong>Preferences</strong> (functional): Stores your dashboard layout and column visibility preferences in your browser&apos;s local storage.</li>
            </ul>
            <p className="mt-2">We do not use advertising or tracking cookies. No data is shared with advertisers.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-shark-900 mt-8 mb-3">9. Data Breach Notification</h2>
            <p>In the event of a data breach that is likely to result in serious harm, we will:</p>
            <ul className="list-disc ml-6 space-y-1 mt-2">
              <li>Notify the Office of the Australian Information Commissioner (OAIC) as soon as practicable</li>
              <li>Notify affected individuals within 30 days</li>
              <li>Take immediate steps to contain and remediate the breach</li>
              <li>Conduct a root cause analysis and implement preventive measures</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-shark-900 mt-8 mb-3">10. Complaints</h2>
            <p>If you believe we have breached the Australian Privacy Principles, you may lodge a complaint with us at <a href={`mailto:${contactEmail}`} className="text-action-500 underline">{contactEmail}</a>. We will investigate and respond within 30 days.</p>
            <p className="mt-2">If you are not satisfied with our response, you may lodge a complaint with the <a href="https://www.oaic.gov.au/privacy/privacy-complaints" className="text-action-500 underline" target="_blank" rel="noopener noreferrer">Office of the Australian Information Commissioner (OAIC)</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-shark-900 mt-8 mb-3">11. Contact Us</h2>
            <p>For privacy-related enquiries, contact our Privacy Officer:</p>
            <p className="mt-2">Email: <a href={`mailto:${contactEmail}`} className="text-action-500 underline">{contactEmail}</a></p>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-shark-100 text-xs text-shark-400">
          <p>&copy; {new Date().getFullYear()} {companyName}. All rights reserved.</p>
          <div className="flex gap-4 mt-2">
            <Link href="/login" className="hover:text-action-500">Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
