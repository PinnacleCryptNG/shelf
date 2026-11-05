import { LogoMark } from "@/components/logo";

export default function Loading() {
  return (
    <div className="flex min-h-[70dvh] items-center justify-center" role="status" aria-label="Loading">
      <div className="relative overflow-hidden rounded-xl p-2">
        <LogoMark size={44} />
        <span className="scan-line [animation-iteration-count:infinite] [animation-duration:1.2s]" />
      </div>
    </div>
  );
}
