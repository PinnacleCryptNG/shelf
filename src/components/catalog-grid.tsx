"use client";
import { AllCommunityModule, ModuleRegistry, themeQuartz, type ColDef, type ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useMemo } from "react";

ModuleRegistry.registerModules([AllCommunityModule]);

export const shelfGridTheme = themeQuartz.withParams({
  fontFamily: "var(--font-body)",
  backgroundColor: "#fbf8f2",
  foregroundColor: "#191714",
  headerBackgroundColor: "#f3eee4",
  headerFontWeight: 600,
  borderColor: "#ddd3c2",
  rowHoverColor: "#f3eee4",
  selectedRowBackgroundColor: "#d9502b1a",
  accentColor: "#d9502b",
  wrapperBorderRadius: 14,
  fontSize: 14,
  rowHeight: 46,
  headerHeight: 42,
});

export type GridProduct = { name: string; description: string; price: number; category: string; tags: string[]; image_url: string | null; stock?: number | null };

export function CatalogGrid({ rows, currency, onChange }: { rows: GridProduct[]; currency: string; onChange: (rows: GridProduct[]) => void }) {
  const cols = useMemo<ColDef<GridProduct>[]>(() => [
    { field: "name", headerName: "Product", editable: true, pinned: "left", minWidth: 190, flex: 1.4 },
    {
      field: "price", headerName: `Price (${currency})`, editable: true, width: 120, type: "rightAligned",
      valueParser: (p) => Math.max(0, Number(String(p.newValue).replace(/[^\d.]/g, "")) || 0),
      valueFormatter: (p) => Number(p.value ?? 0).toFixed(2), cellClass: "mono",
    },
    { field: "category", editable: true, width: 130 },
    {
      field: "stock", headerName: "Stock", editable: true, width: 96, type: "rightAligned",
      valueParser: (p) => (p.newValue === "" || p.newValue == null ? null : Math.max(0, Math.round(Number(p.newValue)) || 0)),
      valueFormatter: (p) => (p.value == null ? "∞" : String(p.value)),
    },
    { field: "description", editable: true, minWidth: 240, flex: 2, cellEditor: "agLargeTextCellEditor", cellEditorPopup: true, tooltipField: "description" },
    {
      field: "tags", editable: true, minWidth: 160, flex: 1,
      valueFormatter: (p) => (p.value || []).join(", "),
      valueParser: (p) => String(p.newValue || "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 8),
    },
    {
      headerName: "", width: 64, sortable: false, resizable: false, pinned: "right",
      cellRenderer: (p: ICellRendererParams<GridProduct>) => (
        <button aria-label="Remove product" className="text-muted hover:text-tomato" onClick={() => onChange(rows.filter((r) => r !== p.data))}>✕</button>
      ),
    },
  ], [currency, rows, onChange]);

  return (
    <div style={{ height: Math.min(560, 46 * rows.length + 60) }}>
      <AgGridReact<GridProduct>
        theme={shelfGridTheme}
        rowData={rows}
        columnDefs={cols}
        defaultColDef={{ sortable: true, resizable: true }}
        singleClickEdit
        stopEditingWhenCellsLoseFocus
        onCellValueChanged={(e) => onChange(rows.map((r) => (r === e.data ? { ...e.data } : r)))}
        getRowId={(p) => String(rows.indexOf(p.data))}
        tooltipShowDelay={400}
      />
    </div>
  );
}
