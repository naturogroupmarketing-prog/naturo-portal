"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { requestConsumable } from "@/app/actions/consumables";

interface Consumable {
  id: string;
  name: string;
  category: string;
  unitType: string;
  region: { name: string };
}

export function RequestConsumablesClient({ consumables }: { consumables: Consumable[] }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (submitted) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-shark-900">Request Consumables</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <Icon name="check" size={28} className="text-emerald-500" />
            </div>
            <h2 className="text-lg font-semibold text-emerald-700">Request Submitted</h2>
            <p className="text-sm text-shark-400 mt-2">
              Your manager has been notified. You can track the status in My Requests.
            </p>
            <Button className="mt-4" onClick={() => setSubmitted(false)}>
              Submit Another Request
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-shark-900">Request Consumables</h1>
        <p className="text-sm text-shark-400 mt-1">Request items from your region.</p>
      </div>

      <Card>
        <CardContent className="py-6">
          <form
            action={async (fd) => {
              setSubmitting(true);
              setError(null);
              try {
                await requestConsumable(fd);
                setSubmitted(true);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to submit request");
              } finally {
                setSubmitting(false);
              }
            }}
            className="space-y-4 max-w-md"
          >
            <div>
              <label htmlFor="consumableId" className="block text-sm font-medium text-shark-700 mb-1">Item *</label>
              <Select id="consumableId" name="consumableId" required>
                <option value="">Select an item</option>
                {consumables.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.unitType}) — {c.region.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-shark-700 mb-1">Quantity *</label>
              <Input id="quantity" name="quantity" type="number" min="1" max="9999" required placeholder="How many do you need?" />
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-shark-700 mb-1">Notes</label>
              <textarea
                id="notes"
                name="notes"
                className="w-full rounded-xl border border-shark-200 px-3.5 py-2 text-sm text-shark-900 focus:border-action-400 focus:outline-none focus:ring-2 focus:ring-action-400/20 transition-colors"
                rows={3}
                placeholder="Any additional details..."
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
