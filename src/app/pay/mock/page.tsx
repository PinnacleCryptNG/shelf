import { notFound } from "next/navigation";
import { mockAllowed, paypalConfigured } from "@/lib/paypal";
import { getOrderByPayPalId } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function MockPay({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  if (paypalConfigured() || !mockAllowed()) notFound();
  const { token = "" } = await searchParams;
  const order = await getOrderByPayPalId(token);
  if (!order) return <main className="p-10">Unknown checkout.</main>;
  return (
    <main className="mx-auto max-w-md p-10 font-mono text-sm">
      <p className="mb-4">Mock PayPal approval (no PayPal keys configured).</p>
      <a className="underline" href={`/pay/return?order=${order.id}&token=${token}`}>Approve payment</a>
      <span className="mx-3">·</span>
      <a className="underline" href={`/pay/cancel?order=${order.id}&token=${token}`}>Cancel</a>
    </main>
  );
}
