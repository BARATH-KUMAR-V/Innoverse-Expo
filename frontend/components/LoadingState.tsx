export default function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-navy-deep/60">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-deep/20 border-t-gold" aria-hidden="true" />
      <p className="text-sm tracking-wide">{message}</p>
    </div>
  );
}
