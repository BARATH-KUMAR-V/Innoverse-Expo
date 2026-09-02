export default function StatsCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-navy-deep/10 bg-white px-6 py-6 text-center shadow-sm">
      <p className="mb-2 text-xs uppercase tracking-[0.2em] text-navy-deep/50">{label}</p>
      <p className="font-serif text-3xl text-navy-deep">{value}</p>
    </div>
  );
}
