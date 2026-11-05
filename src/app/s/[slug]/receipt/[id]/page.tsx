import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { getOrderRow, getShop } from "@/lib/store";
import { formatMoney } from "@/lib/types";

export const dynamic = "force-dynamic";

const copy: Record<string, [string, string]> = {
  PAID: ["Paid. Thank you!", "PayPal confirmed your payment and the shop has been told."],
  SHIPPED: ["On its way", "The shop has added tracking in PayPal."],
  REFUNDED: ["Refunded", "The shop refunded this order to your PayPal account."],
  CANCELLED: ["Checkout cancelled", "This checkout was closed before payment. No money moved."],
  CREATED: ["Waiting for PayPal", "This order hasn't been approved in PayPal yet."],
  APPROVED: ["Confirming payment", "PayPal approved it; we're finishing the capture."],
};

export default async function Receipt({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const p = await params;
  const [shop, order] = await Promise.all([getShop(p.slug), getOrderRow(p.id)]);
  if (!shop || !order || order.shop_id !== shop.id) notFound();
  const [title, sub] = copy[order.status];
  const good = ["PAID", "SHIPPED"].includes(order.status);
  return (
    <>
      <Header right={<span />} />
      <main className="mx-auto max-w-lg px-5 pb-20 pt-6">
        <div className="rise tag p-7 pl-10">
          <p className="mono text-xs uppercase tracking-widest text-muted">{shop.name} · {order.id}</p>
          <h1 className={`display mt-3 text-4xl font-semibold ${good ? "text-moss" : ""}`}>{title}</h1>
          <p className="mt-2 text-muted">{sub}</p>
          <ul className="mt-6 space-y-2 border-t border-dashed border-line pt-4 text-sm">
            {order.items.map((i) => <li key={i.product_id} className="flex justify-between"><span>{i.quantity} × {i.name}</span><span className="mono">{formatMoney(i.quantity * i.unit_cents, order.currency)}</span></li>)}
          </ul>
          <div className="mt-3 flex justify-between border-t border-line pt-3 font-semibold"><span>Total</span><span className="mono">{formatMoney(order.total_cents, order.currency)}</span></div>
          {order.channel === "agent" && <p className="mt-4 text-sm text-muted">Ordered for you by <strong className="text-ink">{order.agent_name || "an AI agent"}</strong>.{["PAID", "SHIPPED", "REFUNDED", "APPROVED"].includes(order.status) && " You approved it in PayPal."}</p>}
          {order.tracking && <p className="mono mt-3 text-sm">Tracking: {order.tracking.carrier} {order.tracking.number}</p>}
        </div>
        <div className="mt-6 flex gap-3">
          <Link href={`/s/${shop.slug}`} className="btn btn-ghost">Back to {shop.name}</Link>
          {order.channel === "agent" && <Link href="/agent" className="btn btn-ink">Back to the agent</Link>}
        </div>
      </main>
    </>
  );
}
