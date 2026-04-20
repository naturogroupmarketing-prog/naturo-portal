"use client";

import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Icon } from "@/components/ui/icon";
import {
  bulkImportAssets,
  bulkImportConsumables,
  bulkImportStaff,
  type ImportResult,
  type AssetImportRow,
  type ConsumableImportRow,
  type StaffImportRow,
} from "@/app/actions/import";

// ─── Types ────────────────────────────────────────────

type ImportType = "assets" | "consumables" | "staff";
type WizardStep = "select" | "upload" | "map" | "preview" | "result";

interface Region {
  id: string;
  name: string;
  state: { id: string; name: string };
}

interface FieldDef {
  key: string;
  label: string;
  required: boolean;
}

interface Props {
  regions: Region[];
}

// ─── Field Definitions ────────────────────────────────

const assetFields: FieldDef[] = [
  { key: "name", label: "Asset Name", required: true },
  { key: "category", label: "System (Vacuum/Mop/Tub)", required: true },
  { key: "description", label: "Description", required: false },
  { key: "serialNumber", label: "Serial Number", required: false },
  { key: "purchaseDate", label: "Purchase Date", required: false },
  { key: "purchaseCost", label: "Purchase Cost", required: false },
  { key: "supplier", label: "Supplier", required: false },
  { key: "notes", label: "Notes", required: false },
  { key: "isHighValue", label: "High Value (yes/no)", required: false },
];

const consumableFields: FieldDef[] = [
  { key: "name", label: "Supply Name", required: true },
  { key: "category", label: "Category", required: true },
  { key: "unitType", label: "Unit Type (e.g., Box, Pack, Each)", required: true },
  { key: "quantityOnHand", label: "Quantity On Hand", required: false },
  { key: "minimumThreshold", label: "Minimum Threshold", required: false },
  { key: "reorderLevel", label: "Reorder Level", required: false },
  { key: "supplier", label: "Supplier", required: false },
  { key: "notes", label: "Notes", required: false },
];

const staffFields: FieldDef[] = [
  { key: "name", label: "Full Name", required: true },
  { key: "email", label: "Email", required: true },
  { key: "role", label: "Role (STAFF / BRANCH_MANAGER / SUPER_ADMIN)", required: false },
];

function getFields(type: ImportType): FieldDef[] {
  if (type === "assets") return assetFields;
  if (type === "consumables") return consumableFields;
  return staffFields;
}

// ─── Auto-match columns ──────────────────────────────

function autoMatch(csvHeaders: string[], fields: FieldDef[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const aliases: Record<string, string[]> = {
    name: ["name", "asset name", "item name", "consumable name", "full name", "description name", "title", "asset tag"],
    category: ["category", "type", "asset type", "group", "class", "system", "asset system"],
    description: ["description", "desc", "details", "notes description"],
    serialNumber: ["serial", "serial number", "serial no", "serial #", "s/n"],
    purchaseDate: ["purchase date", "date purchased", "acquired", "date acquired", "acquisition date"],
    purchaseCost: ["cost", "purchase cost", "price", "purchase price", "value", "amount"],
    supplier: ["supplier", "vendor", "manufacturer", "brand"],
    notes: ["notes", "comments", "remarks"],
    isHighValue: ["high value", "is high value", "valuable"],
    unitType: ["unit", "unit type", "uom", "unit of measure", "measure"],
    quantityOnHand: ["quantity", "qty", "quantity on hand", "stock", "on hand", "count"],
    minimumThreshold: ["minimum", "min threshold", "minimum threshold", "min qty", "low stock"],
    reorderLevel: ["reorder", "reorder level", "reorder point", "reorder qty"],
    email: ["email", "email address", "e-mail", "mail"],
    role: ["role", "position", "job title", "access level"],
  };

  for (const field of fields) {
    const fieldAliases = aliases[field.key] || [field.key];
    for (const header of csvHeaders) {
      const normalized = header.toLowerCase().trim();
      if (fieldAliases.some((alias) => normalized === alias || normalized.includes(alias))) {
        mapping[field.key] = header;
        break;
      }
    }
  }

  return mapping;
}

// ─── CSV Template ─────────────────────────────────────

function downloadTemplate(type: ImportType) {
  const fields = getFields(type);
  const headers = fields.map((f) => f.label);
  const csv = headers.join(",") + "\n";
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${type}-import-template.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Component ───────────────────────────────────

export function ImportClient({ regions }: Props) {
  const [step, setStep] = useState<WizardStep>("select");
  const [importType, setImportType] = useState<ImportType>("assets");
  const [defaultRegionId, setDefaultRegionId] = useState("");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [mappedData, setMappedData] = useState<Record<string, unknown>[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── File Handling ────────────────────────────────

  const handleFile = useCallback(
    (file: File) => {
      setUploadError("");

      // Validate file extension
      const allowedExtensions = [".csv", ".xlsx", ".xls"];
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        setUploadError(`Invalid file type "${ext}". Please upload a .csv, .xlsx, or .xls file.`);
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setUploadError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum file size is 5MB.`);
        return;
      }

      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const XLSX = await import("xlsx");
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
        if (json.length === 0) return;

        const headers = Object.keys(json[0]);
        setCsvHeaders(headers);
        setRawRows(json);

        // Auto-match columns
        const fields = getFields(importType);
        const mapping = autoMatch(headers, fields);
        setColumnMapping(mapping);

        setStep("map");
      };
      reader.readAsArrayBuffer(file);
    },
    [importType]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // ─── Column Mapping ───────────────────────────────

  function updateMapping(fieldKey: string, csvHeader: string) {
    setColumnMapping((prev) => {
      const next = { ...prev };
      if (csvHeader === "") {
        delete next[fieldKey];
      } else {
        next[fieldKey] = csvHeader;
      }
      return next;
    });
  }

  // ─── Preview & Validate ───────────────────────────

  function buildPreview() {
    const fields = getFields(importType);
    const errors: Record<number, string> = {};
    const mapped = rawRows.map((row, i) => {
      const obj: Record<string, unknown> = {};
      for (const field of fields) {
        const header = columnMapping[field.key];
        let val = header ? row[header]?.toString().trim() : "";
        if (field.key === "isHighValue") {
          obj[field.key] = ["yes", "true", "1", "y"].includes(val.toLowerCase());
        } else if (["purchaseCost", "quantityOnHand", "minimumThreshold", "reorderLevel"].includes(field.key)) {
          obj[field.key] = val ? Number(val.replace(/[,$]/g, "")) : undefined;
        } else {
          obj[field.key] = val || undefined;
        }

        if (field.required && !val) {
          errors[i] = `Missing required field: ${field.label}`;
        }
      }

      // Set regionId
      if (importType !== "staff") {
        obj.regionId = defaultRegionId;
        if (!defaultRegionId) errors[i] = "No region selected";
      } else {
        if (defaultRegionId) obj.regionId = defaultRegionId;
      }

      return obj;
    });

    setMappedData(mapped);
    setValidationErrors(errors);
    setStep("preview");
  }

  // ─── Import ───────────────────────────────────────

  async function runImport() {
    setImporting(true);
    try {
      // Filter out rows with validation errors
      const validRows = mappedData.filter((_, i) => !validationErrors[i]);

      let res: ImportResult;
      if (importType === "assets") {
        res = await bulkImportAssets(validRows as unknown as AssetImportRow[]);
      } else if (importType === "consumables") {
        res = await bulkImportConsumables(validRows as unknown as ConsumableImportRow[]);
      } else {
        res = await bulkImportStaff(validRows as unknown as StaffImportRow[]);
      }
      setResult(res);
      setStep("result");
    } catch (error) {
      setResult({
        success: 0,
        skipped: 0,
        errors: [{ row: 0, field: "general", message: error instanceof Error ? error.message : "Import failed" }],
      });
      setStep("result");
    } finally {
      setImporting(false);
    }
  }

  // ─── Reset ────────────────────────────────────────

  function reset() {
    setStep("select");
    setCsvHeaders([]);
    setRawRows([]);
    setColumnMapping({});
    setMappedData([]);
    setValidationErrors({});
    setResult(null);
    setFileName("");
    setUploadError("");
    setDefaultRegionId("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const fields = getFields(importType);
  const requiredFields = fields.filter((f) => f.required);
  const allRequiredMapped = requiredFields.every((f) => columnMapping[f.key]);

  // ─── Render ───────────────────────────────────────

  return (
    <Card padding="none">
    <div className="p-4 sm:p-5 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-action-100 flex items-center justify-center shrink-0">
          <Icon name="upload" size={14} className="text-action-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-shark-900 dark:text-shark-100">Import Data</h3>
          <p className="text-xs text-shark-400">Bulk import assets, supplies, or staff from CSV or Excel files</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-2">
        {(["select", "upload", "map", "preview", "result"] as WizardStep[]).map((s, i) => {
          const labels = ["Select Type", "Upload File", "Map Columns", "Preview", "Results"];
          const stepIndex = ["select", "upload", "map", "preview", "result"].indexOf(step);
          const isActive = i === stepIndex;
          const isDone = i < stepIndex;
          return (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <div className={`w-8 h-0.5 ${isDone ? "bg-action-400" : "bg-shark-200 dark:bg-shark-700"}`} />}
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    isDone
                      ? "bg-action-400 text-white"
                      : isActive
                      ? "bg-action-50 text-action-600 ring-2 ring-action-400"
                      : "bg-shark-100 dark:bg-shark-800 text-shark-400"
                  }`}
                >
                  {isDone ? <Icon name="check" size={12} /> : i + 1}
                </div>
                <span className={`text-xs hidden sm:inline ${isActive ? "text-shark-900 dark:text-shark-100 font-medium" : "text-shark-400"}`}>
                  {labels[i]}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Step 1: Select Type ──────────────────── */}
      {step === "select" && (
        <div className="grid gap-4 sm:grid-cols-3">
          {([
            { type: "assets" as ImportType, label: "Assets", icon: "package" as const, desc: "Import fixed assets like equipment, tools, vehicles" },
            { type: "consumables" as ImportType, label: "Supplies", icon: "droplet" as const, desc: "Import supply items like PPE, stationery, and other supplies" },
            { type: "staff" as ImportType, label: "Staff", icon: "users" as const, desc: "Import staff members with email and role assignments" },
          ]).map((item) => (
            <Card
              key={item.type}
              className={`cursor-pointer transition-all hover:shadow-md ${
                importType === item.type ? "ring-2 ring-action-400 bg-action-50/30" : ""
              }`}
              onClick={() => setImportType(item.type)}
            >
              <CardContent className="py-6 text-center">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${
                  importType === item.type ? "bg-action-100 text-action-600" : "bg-shark-100 dark:bg-shark-800 text-shark-400"
                }`}>
                  <Icon name={item.icon} size={24} />
                </div>
                <h3 className="font-semibold text-shark-900 dark:text-shark-100">{item.label}</h3>
                <p className="text-xs text-shark-400 mt-1">{item.desc}</p>
                <div className="mt-3 flex flex-wrap gap-1 justify-center">
                  {getFields(item.type)
                    .filter((f) => f.required)
                    .map((f) => (
                      <span key={f.key} className="text-[10px] px-1.5 py-0.5 bg-shark-100 dark:bg-shark-800 text-shark-500 dark:text-shark-400 rounded">
                        {f.label} *
                      </span>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {step === "select" && (
        <div className="flex items-center gap-3">
          <Button onClick={() => setStep("upload")}>
            Continue with {importType.charAt(0).toUpperCase() + importType.slice(1)}
            <Icon name="arrow-right" size={16} className="ml-2" />
          </Button>
          <Button variant="outline" onClick={() => downloadTemplate(importType)}>
            <Icon name="download" size={16} className="mr-2" />
            Download Template
          </Button>
        </div>
      )}

      {/* ─── Step 2: Upload File ──────────────────── */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="upload" size={20} />
              Upload {importType.charAt(0).toUpperCase() + importType.slice(1)} File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Region selector for assets/consumables */}
            {importType !== "staff" && (
              <div>
                <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">
                  Assign all items to region <span className="text-red-500">*</span>
                </label>
                <Select
                  value={defaultRegionId}
                  onChange={(e) => setDefaultRegionId(e.target.value)}
                >
                  <option value="">Select a region...</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.state.name} — {r.name}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-shark-400 mt-1">
                  All imported items will be assigned to this region.
                </p>
              </div>
            )}

            {importType === "staff" && (
              <div>
                <label className="block text-sm font-medium text-shark-700 dark:text-shark-300 mb-1">
                  Default region for staff (optional)
                </label>
                <Select
                  value={defaultRegionId}
                  onChange={(e) => setDefaultRegionId(e.target.value)}
                >
                  <option value="">No default region</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.state.name} — {r.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {/* Drop zone */}
            <div
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-shark-200 rounded-xl p-8 text-center hover:border-action-400 hover:bg-action-50/20 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Icon name="file-spreadsheet" size={40} className="mx-auto text-shark-300 mb-3" />
              <p className="text-sm text-shark-600 dark:text-shark-400 font-medium">
                Drop your CSV or Excel file here
              </p>
              <p className="text-xs text-shark-400 mt-1">
                or click to browse — Supports .csv, .xlsx, .xls
              </p>
              {fileName && (
                <div className="mt-3 inline-flex items-center gap-2 bg-action-50 text-action-700 px-3 py-1.5 rounded-lg text-sm">
                  <Icon name="file-text" size={14} />
                  {fileName}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={onFileSelect}
                className="hidden"
              />
            </div>

            {uploadError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                <Icon name="alert-triangle" size={16} className="text-red-500 flex-shrink-0" />
                {uploadError}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => { setStep("select"); setFileName(""); setUploadError(""); }}>
                <Icon name="arrow-left" size={16} className="mr-2" />
                Back
              </Button>
              <Button variant="outline" onClick={() => downloadTemplate(importType)}>
                <Icon name="download" size={16} className="mr-2" />
                Download Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Step 3: Map Columns ──────────────────── */}
      {step === "map" && (
        <Card>
          <CardHeader>
            <CardTitle>Map Columns</CardTitle>
            <p className="text-sm text-shark-400 mt-1">
              Match your file columns to the required fields. We auto-matched what we could.
              <span className="font-medium text-shark-600 dark:text-shark-400"> {rawRows.length} rows</span> found in{" "}
              <span className="font-medium text-shark-600 dark:text-shark-400">{fileName}</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Region selector (shown on map step too for convenience) */}
            {importType !== "staff" && (
              <div className="flex items-center gap-3 pb-3 mb-3 border-b border-shark-100 dark:border-shark-700">
                <div className="w-48 flex-shrink-0">
                  <span className="text-sm text-shark-700 dark:text-shark-300 font-medium">Region</span>
                  <span className="text-red-500 ml-1">*</span>
                </div>
                <Icon name="arrow-right" size={14} className="text-shark-300 flex-shrink-0" />
                <Select
                  value={defaultRegionId}
                  onChange={(e) => setDefaultRegionId(e.target.value)}
                  className={`flex-1 ${!defaultRegionId ? "border-red-300 ring-1 ring-red-200" : ""}`}
                >
                  <option value="">Select a region...</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.state.name} — {r.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            {importType === "staff" && (
              <div className="flex items-center gap-3 pb-3 mb-3 border-b border-shark-100 dark:border-shark-700">
                <div className="w-48 flex-shrink-0">
                  <span className="text-sm text-shark-700 dark:text-shark-300 font-medium">Default Region</span>
                </div>
                <Icon name="arrow-right" size={14} className="text-shark-300 flex-shrink-0" />
                <Select
                  value={defaultRegionId}
                  onChange={(e) => setDefaultRegionId(e.target.value)}
                  className="flex-1"
                >
                  <option value="">No default region</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.state.name} — {r.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {fields.map((field) => (
              <div key={field.key} className="flex items-center gap-3">
                <div className="w-48 flex-shrink-0">
                  <span className="text-sm text-shark-700 dark:text-shark-300 font-medium">{field.label}</span>
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </div>
                <Icon name="arrow-right" size={14} className="text-shark-300 flex-shrink-0" />
                <Select
                  value={columnMapping[field.key] || ""}
                  onChange={(e) => updateMapping(field.key, e.target.value)}
                  className="flex-1"
                >
                  <option value="">— Not mapped —</option>
                  {csvHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </Select>
                {columnMapping[field.key] && (
                  <span className="text-xs text-shark-400 flex-shrink-0 w-32 truncate">
                    e.g. &quot;{rawRows[0]?.[columnMapping[field.key]] || "—"}&quot;
                  </span>
                )}
              </div>
            ))}

            <div className="flex items-center gap-3 pt-4 border-t border-shark-100 dark:border-shark-700">
              <Button variant="outline" onClick={() => setStep("upload")}>
                <Icon name="arrow-left" size={16} className="mr-2" />
                Back
              </Button>
              <Button
                onClick={buildPreview}
                disabled={!allRequiredMapped || (importType !== "staff" && !defaultRegionId)}
              >
                Preview Data
                <Icon name="arrow-right" size={16} className="ml-2" />
              </Button>
              {!allRequiredMapped && (
                <span className="text-xs text-red-500">
                  Please map all required fields
                </span>
              )}
              {allRequiredMapped && importType !== "staff" && !defaultRegionId && (
                <span className="text-xs text-red-500">
                  Please select a region above
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Step 4: Preview & Validate ───────────── */}
      {step === "preview" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Preview &amp; Validate</CardTitle>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-action-50 text-action-700 ring-1 ring-action-600/20">
                  {mappedData.length - Object.keys(validationErrors).length} ready
                </span>
                {Object.keys(validationErrors).length > 0 && (
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-50 text-red-700 ring-1 ring-red-600/20">
                    {Object.keys(validationErrors).length} errors
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-shark-100 dark:border-shark-700">
                    <th scope="col" className="text-left py-2 px-3 text-xs font-medium text-shark-400 w-10">#</th>
                    {fields.map((f) => (
                      <th key={f.key} scope="col" className="text-left py-2 px-3 text-xs font-medium text-shark-400">
                        {f.label}
                      </th>
                    ))}
                    <th scope="col" className="text-left py-2 px-3 text-xs font-medium text-shark-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mappedData.slice(0, 50).map((row, i) => {
                    const hasError = validationErrors[i];
                    return (
                      <tr
                        key={i}
                        className={`border-b border-shark-50 dark:border-shark-800 ${hasError ? "bg-red-50/50" : ""}`}
                      >
                        <td className="py-2 px-3 text-xs text-shark-400">{i + 2}</td>
                        {fields.map((f) => (
                          <td key={f.key} className="py-2 px-3 text-shark-700 dark:text-shark-300 max-w-[200px] truncate">
                            {row[f.key]?.toString() || <span className="text-shark-300">—</span>}
                          </td>
                        ))}
                        <td className="py-2 px-3">
                          {hasError ? (
                            <span className="text-xs text-red-600">{hasError}</span>
                          ) : (
                            <Icon name="check" size={14} className="text-action-500" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {mappedData.length > 50 && (
                <p className="text-xs text-shark-400 mt-2 text-center">
                  Showing first 50 of {mappedData.length} rows
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-shark-100 dark:border-shark-700 mt-4">
              <Button variant="outline" onClick={() => setStep("map")}>
                <Icon name="arrow-left" size={16} className="mr-2" />
                Back to Mapping
              </Button>
              <Button
                onClick={runImport}
                disabled={importing || mappedData.length - Object.keys(validationErrors).length === 0}
              >
                {importing ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Importing...
                  </>
                ) : (
                  <>
                    <Icon name="upload" size={16} className="mr-2" />
                    Import {mappedData.length - Object.keys(validationErrors).length} Rows
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Step 5: Results ──────────────────────── */}
      {step === "result" && result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="check-circle" size={20} className="text-action-500" />
              Import Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-action-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-action-700">{result.success}</p>
                <p className="text-xs text-action-600">Imported</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-[#E8532E]">{result.skipped}</p>
                <p className="text-xs text-[#E8532E]">Skipped (duplicates)</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-red-700">{result.errors.length}</p>
                <p className="text-xs text-red-600">Errors</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="bg-red-50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-red-800 mb-2">Error Details</h4>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-700">
                      {err.row > 0 ? `Row ${err.row}` : "General"}: {err.message}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-4 border-t border-shark-100 dark:border-shark-700">
              <Button onClick={reset}>
                <Icon name="upload" size={16} className="mr-2" />
                Import More
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  window.location.href =
                    importType === "assets"
                      ? "/assets"
                      : importType === "consumables"
                      ? "/consumables"
                      : "/admin/users";
                }}
              >
                Go to {importType.charAt(0).toUpperCase() + importType.slice(1)}
                <Icon name="arrow-right" size={16} className="ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </Card>
  );
}
