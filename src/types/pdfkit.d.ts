/**
 * Minimal ambient declaration for `pdfkit`.
 *
 * The project does not depend on `@types/pdfkit`, and `pdfkit` ships no bundled
 * types. This declares only the chainable PDFDocument API surface that
 * `src/lib/certificate-pdf.ts` actually uses, so the dynamic import type-checks
 * under `strict` without pulling in an extra dev dependency.
 */
declare module "pdfkit" {
  interface PDFDocumentOptions {
    size?: string | [number, number];
    layout?: "portrait" | "landscape";
    margins?: { top: number; bottom: number; left: number; right: number };
    margin?: number;
    info?: Record<string, string>;
  }

  interface PDFTextOptions {
    width?: number;
    align?: "left" | "center" | "right" | "justify";
    characterSpacing?: number;
    lineBreak?: boolean;
  }

  interface PDFPage {
    width: number;
    height: number;
    margins: { top: number; bottom: number; left: number; right: number };
  }

  class PDFDocument {
    constructor(options?: PDFDocumentOptions);

    page: PDFPage;

    on(event: "data", listener: (chunk: Buffer) => void): this;
    on(event: "end", listener: () => void): this;
    on(event: "error", listener: (err: Error) => void): this;

    font(name: string): this;
    fontSize(size: number): this;
    fillColor(color: string): this;
    strokeColor(color: string): this;
    lineWidth(width: number): this;

    text(text: string, x?: number, y?: number, options?: PDFTextOptions): this;

    rect(x: number, y: number, w: number, h: number): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    stroke(): this;
    fill(color?: string): this;

    save(): this;
    restore(): this;

    end(): void;
  }

  export default PDFDocument;
}
