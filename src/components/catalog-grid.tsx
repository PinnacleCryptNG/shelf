"use client";
import { AllCommunityModule, ModuleRegistry, themeQuartz, type ColDef, type ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useMemo } from "react";

ModuleRegistry.registerModules([AllCommunityModule]);

export const shelfGridTheme = themeQuartz.withParams({
  fontFamily: "var(--font-body)",
  backgroundColor: "#ffffff",
  foregroundColor: "#0f1012",
  headerBackgroundColor: "#f6f6f2",
  headerFontWeight: 600,
  borderColor: "#e2e2db",
  rowHoverColor: "#f6f6f2",
  selectedRowBackgroundColor: "#ff4a241a",
  accentColor: "#ff4a24",
  wrapperBorderRadius: 14,
  fontSize: 14,
  rowHeight: 46,
  headerHeight: 42,
});

export type Market = { low: number; median: number; high: number; count: number; examples: { title: string; domain: string; price: number; url: string }[] } | null;

export type GridProduct = { name: string; description: string; price: number; category: string; tags: string[]; image_url: string | null; stock?: number | null };

export function CatalogGrid({ rows, currency, onChange, market, marketLoading }: { rows: GridProduct[]; currency: string; onChange: (rows: GridProduct[]) => void; market?: Record<string, Market> | null; marketLoading?: boolean }) {
  const cols = useMemo<ColDef<GridProduct>[]>(() => [
    { field: "name", headerName: "Product", editable: true, pinned: "left", minWidth: 190, flex: 1.4 },
    {
      field: "price", headerName: `Price (${currency})`, editable: true, width: 120, type: "rightAligned",
      valueParser: (p) => Math.max(0, Number(String(p.newValue).replace(/[^\d.]/g, "")) || 0),
      valueFormatter: (p) => Number(p.value ?? 0).toFixed(2), cellClass: "mono",
    },
    ...(market ? [{
      headerName: "Market (Channel3)", colId: "market", width: 210, sortable: false, editable: false,
      tooltipValueGetter: (p) => { const m = market[p.data?.name ?? ""]; return m ? m.examples.map((e) => `${e.title} · ${e.domain} · ${e.price.toFixed(2)}`).join("\n") : undefined; },
      cellRenderer: (p: ICellRendererParams<GridProduct>) => {
        if (marketLoading) return <span className="text-muted">checking…</span>;
        const m = p.data ? market[p.data.name] : undefined;
        if (!m || !p.data) return <span className="text-muted">no close match</span>;
        const diff = (p.data.price - m.median) / m.median;
        const tone = diff > 0.25 ? "text-tomato" : diff < -0.25 ? "text-moss" : "text-muted";
        const label = Math.abs(diff) <= 0.1 ? "on par" : `${Math.round(Math.abs(diff) * 100)}% ${diff > 0 ? "above" : "below"}`;
        return <span><span className="mono">{m.low.toFixed(0)}–{m.high.toFixed(0)}</span> <span className={tone}>· {label}</span></span>;
      },
    } satisfies ColDef<GridProduct>] : []),
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
  ], [currency, rows, onChange, market, marketLoading]);

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
