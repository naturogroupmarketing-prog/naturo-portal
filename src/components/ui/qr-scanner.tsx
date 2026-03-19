"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./button";
import { Modal } from "./modal";

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
}

export function QRScanner({ open, onClose, onScan }: QRScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!open || !scannerRef.current) return;

    let scanner: { stop: () => Promise<void>; clear: () => void } | null = null;

    const startScanner = async () => {
      try {
        setError(null);
        setScanning(true);
        const { Html5Qrcode } = await import("html5-qrcode");
        const scn = new Html5Qrcode("qr-reader");
        scanner = scn as unknown as typeof scanner;
        html5QrCodeRef.current = scn;

        await scn.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            onScan(decodedText);
            scn.stop().then(() => scn.clear()).catch(() => {});
            onClose();
          },
          () => {} // ignore scan failures
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start camera. Make sure you've granted camera permissions.");
        setScanning(false);
      }
    };

    startScanner();

    return () => {
      if (scanner) {
        (scanner as { stop: () => Promise<void> }).stop().catch(() => {});
      }
    };
  }, [open, onScan, onClose]);

  return (
    <Modal open={open} onClose={onClose} title="Scan QR Code">
      <div className="space-y-4">
        <div
          id="qr-reader"
          ref={scannerRef}
          className="w-full rounded-lg overflow-hidden bg-shark-900"
          style={{ minHeight: scanning ? 300 : 0 }}
        />
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 text-center">
            {error}
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
