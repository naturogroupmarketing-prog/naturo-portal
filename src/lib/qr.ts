import QRCode from "qrcode";

export async function generateQRCodeDataURL(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    width: 256,
    margin: 2,
    color: { dark: "#0f1b3d", light: "#ffffff" },
  });
}

export async function generateQRCodeSVG(data: string): Promise<string> {
  return QRCode.toString(data, {
    type: "svg",
    width: 256,
    margin: 2,
    color: { dark: "#0f1b3d", light: "#ffffff" },
  });
}

export function buildAssetQRData(assetCode: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/assets/${assetCode}`;
}
