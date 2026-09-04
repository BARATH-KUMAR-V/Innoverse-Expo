import Link from "next/link";

export default function SuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy-deep px-6 text-center text-cream">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-gold text-2xl text-gold">
        ✓
      </div>
      <h1 className="mb-3 font-serif text-3xl uppercase tracking-wide">Vote Recorded</h1>
      <p className="mb-1 text-cream/80">Thank you for voting!</p>
      <p className="mb-10 max-w-sm text-sm leading-relaxed text-cream/60">
        Your vote has been successfully recorded and cannot be changed.
      </p>
      <Link
        href="/gallery"
        className="rounded-sm border border-gold px-10 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-gold transition hover:bg-gold hover:text-navy-deep"
      >
        Back to Gallery
      </Link>
    </div>
  );
}
