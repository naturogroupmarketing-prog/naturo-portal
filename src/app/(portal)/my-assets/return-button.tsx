"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Icon } from "@/components/ui/icon";
import { staffReturnAsset } from "@/app/actions/returns";

export function ReturnAssetButton({ assignmentId, assetName }: { assignmentId: string; assetName: string }) {
  const [showModal, setShowModal] = useState(false);
  const [condition, setCondition] = useState("GOOD");
  const [notes, setNotes] = useState("");
  const [returning, setReturning] = useState(false);
  const [returned, setReturned] = useState(false);

  const handleReturn = async () => {
    setReturning(true);
    try {
      await staffReturnAsset(assignmentId, condition, notes);
      setReturned(true);
    } finally {
      setReturning(false);
    }
  };

  if (returned) {
    return (
      <p className="mt-3 text-xs text-[#E8532E] flex items-center gap-1">
        <Icon name="clock" size={12} />
        Return pending manager verification
      </p>
    );
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="mt-3"
        onClick={() => setShowModal(true)}
      >
        <Icon name="arrow-left" size={14} className="mr-1" />
        Return
      </Button>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={`Return: ${assetName}`}>
        <div className="space-y-4">
          <p className="text-sm text-shark-500">
            Submit this asset for return. Your branch manager will verify and restock.
          </p>
          <div>
            <label className="block text-sm font-medium text-shark-700 mb-1">Condition</label>
            <Select value={condition} onChange={(e) => setCondition(e.target.value)}>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="POOR">Poor</option>
              <option value="DAMAGED">Damaged</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-shark-700 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-shark-200 dark:border-shark-700 bg-white dark:bg-shark-800 px-3.5 py-2 text-sm text-shark-900 dark:text-shark-100 focus:border-action-400 focus:outline-none focus:ring-2 focus:ring-action-400/20 transition-colors"
              rows={2}
              placeholder="Any comments about the item's condition..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleReturn} disabled={returning}>
              {returning ? "Submitting..." : "Confirm Return"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
