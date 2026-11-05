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
  const tone = good ? "text-moss" : order.status === "CANCELLED" || order.status === "REFUNDED" ? "text-ink" : "text-[#c2410c]";
  const stamp: Record<string, string> = { PAID: "PAID", SHIPPED: "SHIPPED", REFUNDED: "REFUNDED", CANCELLED: "VOID" };
  return (
    <>
      <Header right={<Link href={`/s/${shop.slug}`} className="rounded-lg px-3 py-2 text-sm text-muted transition hover:text-ink">{shop.name}</Link>} />
      <main className="dots min-h-[calc(100dvh-64px)] px-5 pb-24 pt-8">
        <div className="mx-auto max-w-md">
          <div className="print relative rounded-t-2xl bg-card p-7 shadow-[0_30px_60px_-35px_rgba(15,16,18,.45)] [mask-image:linear-gradient(#000,#000)]">
            <div className="flex items-center justify-between">
              <p className="label">{shop.name}</p>
              <p className="mono text-[11px] text-muted">{new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
            </div>
            <div className="mt-6 flex items-start justify-between gap-4">
              <h1 className={`display min-w-0 text-[2rem] leading-tight sm:text-[2.2rem] ${tone}`}>{title}</h1>
              {stamp[order.status] && <span className={`stamp mt-2 shrink-0 rounded-md border-2 px-2 py-0.5 text-sm font-bold tracking-[.2em] [animation-delay:900ms] ${good ? "border-moss text-moss" : "border-ink/40 text-ink/50"}`}>{stamp[order.status]}</span>}
            </div>
            <p className="mt-2 text-muted">{sub}</p>
            <ul className="mono mt-7 space-y-2.5 border-t border-dashed border-line pt-5 text-[13px]">
              {order.items.map((i) => <li key={i.product_id} className="flex justify-between gap-4"><span>{i.quantity} × {i.name}</span><span>{formatMoney(i.quantity * i.unit_cents, order.currency)}</span></li>)}
            </ul>
            <div className="mt-4 flex justify-between border-t border-dashed border-line pt-4 text-[15px] font-semibold"><span>Total</span><span className="mono">{formatMoney(order.total_cents, order.currency)}</span></div>
            {order.channel === "agent" && <p className="mt-6 rounded-xl bg-paper p-3.5 text-sm text-muted">Ordered for you by <strong className="text-ink">{order.agent_name || "an AI agent"}</strong>.{["PAID", "SHIPPED", "REFUNDED", "APPROVED"].includes(order.status) && " You approved it in PayPal."}</p>}
            {order.tracking && <p className="mt-3 rounded-xl bg-paper p-3.5 text-sm"><span className="text-muted">Tracking</span> <span className="mono">{order.tracking.carrier} {order.tracking.number}</span></p>}
            <p className="mono mt-6 truncate text-center text-[10.5px] text-muted">Order {order.id}</p>
          </div>
          <div aria-hidden className="h-3 bg-[radial-gradient(circle_at_8px_0,transparent_8px,#fff_8.5px)] bg-[length:16px_12px] [transform:scaleY(-1)]" />
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={`/s/${shop.slug}`} className="btn btn-ghost">Back to {shop.name}</Link>
            {order.channel === "agent" && <Link href={`/agent?order=${encodeURIComponent(order.id)}`} className="btn btn-ink">Back to the agent</Link>}
          </div>
        </div>
      </main>
    </>
  );
}
