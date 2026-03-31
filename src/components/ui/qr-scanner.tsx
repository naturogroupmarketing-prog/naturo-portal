"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "./button";
import { Modal } from "./modal";

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
}

export function QRScanner({ open, onClose, onScan }: QRScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  // Keep refs in sync without causing re-renders
  onScanRef.current = onScan;
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const cleanupRef = { current: () => {} };

    // Small delay to let the modal DOM render the #qr-reader div
    const timeout = setTimeout(async () => {
      const el = document.getElementById("qr-reader");
      if (!el) return;

      try {
        setError(null);
        setScanning(true);
        const { Html5Qrcode } = await import("html5-qrcode");
        const scn = new Html5Qrcode("qr-reader");

        await scn.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            onScanRef.current(decodedText);
            scn.stop().then(() => scn.clear()).catch(() => {});
            onCloseRef.current();
          },
          () => {} // ignore scan failures
        );

        // Store cleanup
        cleanupRef.current = () => {
          scn.stop().then(() => scn.clear()).catch(() => {});
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // Try to provide a helpful message based on the error
        if (msg.includes("NotAllowedError") || msg.includes("Permission")) {
          setError("Camera permission denied. Please allow camera access in your browser settings and refresh the page.");
        } else if (msg.includes("NotFoundError") || msg.includes("no camera")) {
          setError("No camera found on this device.");
        } else if (msg.includes("NotReadableError") || msg.includes("in use")) {
          setError("Camera is in use by another app. Close other camera apps and try again.");
        } else if (msg.includes("OverconstrainedError")) {
          // Fallback: try without facing mode constraint
          try {
            const { Html5Qrcode } = await import("html5-qrcode");
            const scn2 = new Html5Qrcode("qr-reader");
            await scn2.start(
              { facingMode: "user" },
              { fps: 10, qrbox: { width: 250, height: 250 } },
              (decodedText: string) => {
                onScanRef.current(decodedText);
                scn2.stop().then(() => scn2.clear()).catch(() => {});
                onCloseRef.current();
              },
              () => {}
            );
            cleanupRef.current = () => { scn2.stop().then(() => scn2.clear()).catch(() => {}); };
            return;
          } catch {
            setError("Camera not supported on this device.");
          }
        } else {
          setError(`Camera error: ${msg}`);
        }
        setScanning(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      cleanupRef.current();
      setScanning(false);
      setError(null);
    };
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Scan QR Code">
      <div className="space-y-4">
        <div
          id="qr-reader"
          ref={scannerRef}
          className="w-full rounded-lg overflow-hidden bg-shark-900"
          style={{ minHeight: scanning ? 300 : 200 }}
        />
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 text-center">
            {error}
          </div>
        )}
        {!scanning && !error && (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-shark-400 animate-pulse">Starting camera...</p>
          </div>
        )}
        <p className="text-xs text-shark-400 text-center">
          Point your camera at an asset QR code to look it up instantly.
        </p>
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}
