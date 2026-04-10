"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { formatDate } from "@/lib/utils";
import { closeRequest } from "@/app/actions/consumables";

type Request = {
  id: string;
  quantity: number;
  status: string;
  notes: string | null;
  rejectionNote: string | null;
  createdAt: string;
  consumable: {
    name: string;
    unitType: string;
    region: { name: string };
  };
};

export function MyRequestsClient({ requests }: { requests: Request[] }) {
  const [closing, setClosing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClose = async (requestId: string) => {
    setClosing(requestId);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("requestId", requestId);
      await closeRequest(fd);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to close request");
    } finally {
      setClosing(null);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-shark-900 tracking-tight">My Consumable Requests</h1>
        <p className="text-sm text-shark-400 mt-1">
          {requests.length} request{requests.length !== 1 ? "s" : ""}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <Icon name="x" size={14} />
          </button>
        </div>
      )}

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-shark-400">No active requests.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Card key={r.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-shark-800">{r.consumable.name}</h3>
                    <p className="text-sm text-shark-400">
                      {r.quantity} {r.consumable.unitType} &middot; {r.consumable.region.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge status={r.status} />
                    {(r.status === "APPROVED" || r.status === "REJECTED") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleClose(r.id)}
                        disabled={closing === r.id}
                      >
                        {closing === r.id ? "Closing..." : "Close"}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-shark-400">
                  <span>Requested: {formatDate(r.createdAt)}</span>
                  {r.rejectionNote && (
                    <span className="text-red-500">Reason: {r.rejectionNote}</span>
                  )}
                </div>
                {r.notes && (
                  <p className="mt-2 text-sm text-shark-500 bg-shark-50 rounded-xl p-3">{r.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
