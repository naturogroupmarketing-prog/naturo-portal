import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set Up Your Workspace | trackio",
  description: "Configure trackio for your industry",
  robots: { index: false, follow: false },
};

export default function SetupLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white antialiased">
      {children}
    </div>
  );
}
