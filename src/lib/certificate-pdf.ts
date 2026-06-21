import "server-only";

/**
 * Server-only certificate PDF generator.
 *
 * Renders a clean, professional A4-landscape "Certificate of Completion".
 * pdfkit is imported dynamically inside the function so it never lands in the
 * client bundle and so build-time font resolution is deferred to runtime.
 * Only the built-in Helvetica / Helvetica-Bold fonts are used (no external
 * .ttf loading, which avoids pdfkit's font-file lookup issues in serverless
 * bundles).
 *
 * NOTE: not wired to any route yet — that arrives in a later phase.
 */

export interface GenerateCertificatePdfParams {
  staffName: string;
  courseName: string;
  completionDate: Date;
  certificateNumber: string;
  organizationName: string;
  expiryDate?: Date | null;
  logoUrl?: string | null;
}

const ACTION_BLUE = "#0057FF";
const INK = "#0B1220";
const MUTED = "#5B6472";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function generateCertificatePdf(
  params: GenerateCertificatePdfParams,
): Promise<Buffer> {
  const {
    staffName,
    courseName,
    completionDate,
    certificateNumber,
    organizationName,
    expiryDate,
  } = params;

  // Dynamic import keeps pdfkit out of the client bundle.
  const PDFDocument = (await import("pdfkit")).default;

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margins: { top: 56, bottom: 56, left: 64, right: 64 },
        info: {
          Title: `Certificate of Completion — ${courseName}`,
          Author: organizationName,
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err: Error) => reject(err));

      // A4 landscape: 841.89 x 595.28 pt
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const left = doc.page.margins.left;
      const right = pageWidth - doc.page.margins.right;
      const contentWidth = right - left;
      const centerX = pageWidth / 2;

      // ─── Outer border ─────────────────────────────────
      doc
        .save()
        .lineWidth(3)
        .strokeColor(ACTION_BLUE)
        .rect(28, 28, pageWidth - 56, pageHeight - 56)
        .stroke()
        .restore();

      doc
        .save()
        .lineWidth(0.75)
        .strokeColor(ACTION_BLUE)
        .rect(38, 38, pageWidth - 76, pageHeight - 76)
        .stroke()
        .restore();

      // ─── Organization name (top) ──────────────────────
      doc
        .font("Helvetica-Bold")
        .fontSize(18)
        .fillColor(INK)
        .text(organizationName.toUpperCase(), left, 78, {
          width: contentWidth,
          align: "center",
          characterSpacing: 2,
        });

      // ─── Title ────────────────────────────────────────
      doc
        .font("Helvetica-Bold")
        .fontSize(40)
        .fillColor(ACTION_BLUE)
        .text("Certificate of Completion", left, 132, {
          width: contentWidth,
          align: "center",
        });

      // Thin accent rule under the title
      doc
        .save()
        .lineWidth(2)
        .strokeColor(ACTION_BLUE)
        .moveTo(centerX - 110, 196)
        .lineTo(centerX + 110, 196)
        .stroke()
        .restore();

      // ─── Body ─────────────────────────────────────────
      doc
        .font("Helvetica")
        .fontSize(15)
        .fillColor(MUTED)
        .text("This certifies that", left, 228, {
          width: contentWidth,
          align: "center",
        });

      doc
        .font("Helvetica-Bold")
        .fontSize(34)
        .fillColor(INK)
        .text(staffName, left, 256, {
          width: contentWidth,
          align: "center",
        });

      doc
        .font("Helvetica")
        .fontSize(15)
        .fillColor(MUTED)
        .text("has successfully completed", left, 312, {
          width: contentWidth,
          align: "center",
        });

      doc
        .font("Helvetica-Bold")
        .fontSize(22)
        .fillColor(ACTION_BLUE)
        .text(courseName, left, 340, {
          width: contentWidth,
          align: "center",
        });

      // ─── Dates ────────────────────────────────────────
      const dateLine = expiryDate
        ? `Completed ${formatDate(completionDate)}   •   Valid until ${formatDate(expiryDate)}`
        : `Completed ${formatDate(completionDate)}`;

      doc
        .font("Helvetica")
        .fontSize(13)
        .fillColor(INK)
        .text(dateLine, left, 392, {
          width: contentWidth,
          align: "center",
        });

      // ─── Footer: certificate number ───────────────────
      const footerY = pageHeight - 88;

      doc
        .save()
        .lineWidth(1)
        .strokeColor(ACTION_BLUE)
        .moveTo(left, footerY)
        .lineTo(right, footerY)
        .stroke()
        .restore();

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(MUTED)
        .text(`Certificate No: ${certificateNumber}`, left, footerY + 12, {
          width: contentWidth,
          align: "center",
        });

      doc.end();
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}
