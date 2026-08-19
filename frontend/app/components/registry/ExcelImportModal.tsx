"use client";

import { useState, useRef } from "react";
import { 
  X, Upload, FileSpreadsheet, Download, CheckCircle2, 
  AlertTriangle, Loader2, FileText, ShieldCheck
} from "lucide-react";
import * as XLSX from "xlsx";

// ==================== SECURITY LIMITS ====================
const MAX_FILE_SIZE = 10 * 1024 * 1024;   // 10 MB (compressed size)
const MAX_ROWS = 5000;                    // Max rows per import
const MAX_CELL_LENGTH = 1000;             // Max characters per cell

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  templateColumns: string[];
  onImport: (data: any[]) => Promise<void>;
}

export default function ExcelImportModal({ 
  isOpen, onClose, title, description, templateColumns, onImport 
}: ExcelImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // ---- GATE 1: Validate BEFORE reading into memory ----
  const validateFile = (f: File): string | null => {
    if (!/\.(xlsx|xls|csv)$/i.test(f.name)) {
      return "Only .xlsx, .xls or .csv files are allowed.";
    }
    if (f.size === 0) return "The file is empty.";
    if (f.size > MAX_FILE_SIZE) {
      return `File too large (${(f.size / 1024 / 1024).toFixed(1)}MB). Maximum allowed is 10MB.`;
    }
    return null;
  };

  // ---- GATE 2 & 3: Validate AFTER decompression ----
  const sanitizeRows = (rows: any[]): { ok: boolean; message?: string; data?: any[] } => {
    if (rows.length === 0) return { ok: false, message: "The file contains no data rows." };
    if (rows.length > MAX_ROWS) {
      return { ok: false, message: `Too many rows (${rows.length.toLocaleString()}). Maximum is ${MAX_ROWS.toLocaleString()} rows per import.` };
    }
    for (const row of rows) {
      for (const [key, value] of Object.entries(row)) {
        if (typeof value === "string" && value.length > MAX_CELL_LENGTH) {
          return { ok: false, message: `Cell "${key}" contains too much text. The file may be corrupted or malicious.` };
        }
      }
    }
    return { ok: true, data: rows };
  };

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile) return;
    setImportResult(null);
    setParsedData([]);
    setPreviewData([]);

    const sizeError = validateFile(selectedFile);
    if (sizeError) {
      setImportResult({ success: false, message: sizeError });
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(worksheet);

        const check = sanitizeRows(rows);
        if (!check.ok) {
          setFile(null);
          setImportResult({ success: false, message: check.message! });
          return;
        }

        setParsedData(check.data!);
        setPreviewData(check.data!.slice(0, 5));
      } catch (err) {
        setFile(null);
        setImportResult({ success: false, message: "Failed to parse the file. It may be corrupted or not a real spreadsheet." });
      }
    };
    reader.onerror = () => {
      setFile(null);
      setImportResult({ success: false, message: "Could not read the file." });
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const downloadTemplate = () => {
    const templateData = [templateColumns.reduce((obj, col) => ({ ...obj, [col]: "" }), {})];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, `${title.replace(/\s+/g, "_")}_Template.xlsx`);
  };

  const resetAndClose = () => {
    setFile(null);
    setParsedData([]);
    setPreviewData([]);
    setImportResult(null);
    onClose();
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    setIsImporting(true);
    setImportResult(null);
    try {
      await onImport(parsedData);
      setImportResult({ success: true, message: `Successfully imported ${parsedData.length.toLocaleString()} records!` });
      setTimeout(resetAndClose, 1500);
    } catch (error: any) {
      setImportResult({ success: false, message: error.message || "Import failed. Please check your data." });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
            </div>
          </div>
          <button onClick={resetAndClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Security Badge */}
          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
            <ShieldCheck className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Protected: Max 10MB file • Max {MAX_ROWS.toLocaleString()} rows • Scanned & validated before import
            </p>
          </div>

          {/* Template Download */}
          <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 rounded-xl">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Download Excel Template</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">Use this template to ensure correct column format.</p>
              </div>
            </div>
            <button 
              onClick={downloadTemplate}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
          </div>

          {/* Drag & Drop Zone */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragging 
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" 
                : file 
                  ? "border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/5" 
                  : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              className="hidden"
            />
            
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet className="h-10 w-10 text-emerald-500" />
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{file.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {(file.size / 1024).toFixed(1)} KB • Click to replace
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-10 w-10 text-slate-400" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Drag & drop your Excel file here
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  or click to browse (.xlsx, .xls, .csv)
                </p>
              </div>
            )}
          </div>

          {/* Preview Data */}
          {previewData.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900 dark:text-white">Preview (first 5 rows)</p>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {parsedData.length.toLocaleString()} rows validated ✓
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/30">
                    <tr>
                      {Object.keys(previewData[0] || {}).map((key) => (
                        <th key={key} className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {previewData.map((row, idx) => (
                      <tr key={idx}>
                        {Object.values(row).map((val: any, valIdx) => (
                          <td key={valIdx} className="px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {String(val || "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Result Message */}
          {importResult && (
            <div className={`flex items-center gap-3 p-4 rounded-xl border ${
              importResult.success 
                ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20" 
                : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20"
            }`}>
              {importResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              )}
              <p className={`text-sm font-medium ${
                importResult.success 
                  ? "text-emerald-700 dark:text-emerald-300" 
                  : "text-red-700 dark:text-red-300"
              }`}>
                {importResult.message}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
          <button 
            onClick={resetAndClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleImport}
            disabled={parsedData.length === 0 || isImporting}
            className="px-6 py-2.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Import Data
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
