"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { acknowledgeAsset } from "@/app/actions/assets";

export function ConfirmReceiptButton({ assignmentId }: { assignmentId: string }) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await acknowledgeAsset(assignmentId);
    } catch {
      addToast("Failed to confirm receipt. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleConfirm} disabled={loading} className="mt-3 w-full">
      <Icon name="check" size={14} className="mr-1.5" />
      {loading ? "Confirming..." : "Confirm Receipt"}
    </Button>
  );
}
