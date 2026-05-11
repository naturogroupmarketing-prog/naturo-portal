import Link from "next/link";

const NAVY = "#002FA0";

const PRODUCT_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "Pricing", href: "#pricing" },
  { label: "Security", href: "#" },
  { label: "Integrations", href: "#" },
];

const COMPANY_LINKS = [
  { label: "About Us", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Careers", href: "#" },
  { label: "Contact", href: "mailto:support@trackio.com.au" },
  { label: "Partner Program", href: "#" },
];

const SUPPORT_LINKS = [
  { label: "Help Centre", href: "#" },
  { label: "Getting Started", href: "#" },
  { label: "API Docs", href: "#" },
  { label: "Status Page", href: "#" },
  { label: "Request a Demo", href: "#" },
];

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      {/* Main footer grid */}
      <div className="max-w-6xl mx-auto px-6 py-14 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">

          {/* Brand column — spans 2 on md */}
          <div className="col-span-2">
            <Link href="/welcome" className="inline-block mb-4">
              <img src="/Logotrackio.svg" alt="trackio" className="h-8 w-auto" />
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs mb-6">
              Asset &amp; supply tracking for operational teams. Know exactly what you have, where it is, and who has it.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3">
              {[
                {
                  label: "LinkedIn",
                  href: "#",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
                      <circle cx="4" cy="4" r="2" />
                    </svg>
                  ),
                },
                {
                  label: "Twitter / X",
                  href: "#",
                  icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  ),
                },
                {
                  label: "Facebook",
                  href: "#",
                  icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                    </svg>
                  ),
                },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-700 transition-colors"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Product</h3>
            <ul className="space-y-2.5">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Company</h3>
            <ul className="space-y-2.5">
              {COMPANY_LINKS.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Support</h3>
            <ul className="space-y-2.5">
              {SUPPORT_LINKS.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>

            {/* Contact pill */}
            <a
              href="mailto:support@trackio.com.au"
              className="mt-6 inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full border transition-colors"
              style={{ borderColor: NAVY, color: NAVY }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              support@trackio.com.au
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-gray-400">
            &copy; {new Date().getFullYear()} trackio Pty Ltd. All rights reserved. ABN 00 000 000 000
          </p>
          <div className="flex items-center gap-5">
            <Link href="/privacy-policy" className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors">
              Terms of Service
            </Link>
            <a href="#" className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors">
              Cookie Settings
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
