"use client";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/70 px-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-lg border border-gold/30 bg-cream px-7 py-8 text-center shadow-2xl">
        <h2 className="mb-2 font-serif text-lg uppercase tracking-wide text-navy-deep">{title}</h2>
        <p className="mb-6 text-sm leading-relaxed text-navy-deep/70">{message}</p>
        <div className="flex flex-col gap-3 sm:flex-row-reverse">
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`flex-1 rounded px-5 py-3 text-sm font-medium uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-60 ${
              danger ? "bg-rose text-white hover:bg-rose/90" : "bg-navy-deep text-gold hover:bg-navy"
            }`}
          >
            {busy ? "Please wait..." : confirmLabel}
          </button>
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded border border-navy-deep/20 px-5 py-3 text-sm font-medium uppercase tracking-wide text-navy-deep transition hover:border-navy-deep/40 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
