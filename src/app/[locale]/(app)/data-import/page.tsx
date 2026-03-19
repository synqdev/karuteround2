export default function DataImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Data Import</h1>
        <p className="text-sm text-muted-foreground mt-1">Import customers and appointments from CSV or Excel files</p>
      </div>

      <div className="rounded-2xl border border-dashed border-border/50 bg-card/50 p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <path d="M12 3v12M8 11l4 4 4-4" />
              <path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium">Drop a file here or click to upload</p>
            <p className="text-xs text-muted-foreground mt-1">Supports CSV, Excel (.xlsx), and JSON files</p>
          </div>
          <label className="cursor-pointer rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            Choose File
            <input type="file" accept=".csv,.xlsx,.json" className="hidden" />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-border/30 bg-card/50 p-5">
        <h3 className="text-sm font-semibold mb-3">Supported Formats</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="rounded-lg border border-border/20 p-3">
            <p className="font-medium">CSV</p>
            <p className="text-xs text-muted-foreground mt-1">UTF-8 or Shift-JIS encoded. Auto-detects column mapping.</p>
          </div>
          <div className="rounded-lg border border-border/20 p-3">
            <p className="font-medium">Excel (.xlsx)</p>
            <p className="text-xs text-muted-foreground mt-1">First sheet is used. Headers in first row.</p>
          </div>
          <div className="rounded-lg border border-border/20 p-3">
            <p className="font-medium">JSON</p>
            <p className="text-xs text-muted-foreground mt-1">Array of customer objects with name, phone, email fields.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
