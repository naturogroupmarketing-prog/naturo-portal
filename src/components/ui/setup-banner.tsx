"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { dismissSetupBanner } from "@/app/actions/onboarding";

interface SetupBannerProps {
  industry?: string | null;
}

export function SetupBanner({ industry }: SetupBannerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDismiss() {
    startTransition(async () => {
      await dismissSetupBanner();
    });
  }

  return (
    <div className="flex items-center gap-4 px-4 py-3.5 rounded-xl bg-gradient-to-r from-action-500 to-action-600 text-white shadow-sm shadow-action-500/20 mb-6">
      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
        <Icon name="git-branch" size={15} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">Finish setting up your workspace</p>
        <p className="text-xs text-white/75 mt-0.5 hidden sm:block">
          {industry
            ? `You chose ${industry} — complete setup to unlock your industry-specific categories and automations.`
            : "Complete the 2-minute setup to get industry-specific categories, workflows, and a personalised dashboard."}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => router.push("/setup")}
          className="text-xs font-semibold px-3 py-1.5 bg-white text-action-600 rounded-lg hover:bg-white/90 transition-colors"
        >
          Continue setup →
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          disabled={isPending}
          className="p-1 text-white/60 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <Icon name="x" size={14} />
        </button>
      </div>
    </div>
  );
}
