"use client";
import { AllCommunityModule, ModuleRegistry, type ColDef } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useMemo } from "react";
import { formatMoney } from "@/lib/types";
import { shelfGridTheme } from "./catalog-grid";

ModuleRegistry.registerModules([AllCommunityModule]);

type Row = { id: string; name: string; price_cents: number; stock: number | null; synced: boolean; sold: number };

export function ProductsGrid({ rows, currency }: { rows: Row[]; currency: string }) {
  const cols = useMemo<ColDef<Row>[]>(() => [
    { field: "name", headerName: "Product", flex: 2, minWidth: 180, filter: true },
    { field: "price_cents", headerName: "Price", width: 110, type: "rightAligned", cellClass: "mono", valueFormatter: (p) => formatMoney(p.value ?? 0, currency) },
    { field: "sold", headerName: "Sold", width: 90, type: "rightAligned", sort: "desc" },
    { field: "stock", headerName: "Stock", width: 96, type: "rightAligned", valueFormatter: (p) => (p.value == null ? "∞" : String(p.value)), cellClassRules: { "text-[#c2410c] font-semibold": (p) => p.value != null && p.value <= 3 } },
    { field: "synced", headerName: "PayPal catalog", width: 140, cellRenderer: (p: { value: boolean }) => (p.value ? <span className="inline-flex items-center gap-1.5 text-moss"><span className="h-1.5 w-1.5 rounded-full bg-moss" />Synced</span> : <span className="text-muted">Not yet</span>) },
  ], [currency]);
  return (
    <div style={{ height: Math.min(520, 46 * rows.length + 60) }}>
      <AgGridReact<Row> theme={shelfGridTheme} rowData={rows} columnDefs={cols} defaultColDef={{ sortable: true, resizable: true }} getRowId={(p) => p.data.id} />
    </div>
  );
}
