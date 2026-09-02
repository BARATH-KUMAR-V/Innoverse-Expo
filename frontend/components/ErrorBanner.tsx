export default function ErrorBanner({ message }: { message: string }) {
  return (
    <div role="alert" className="mx-auto max-w-md rounded border border-rose/30 bg-rose/10 px-4 py-3 text-center text-sm text-rose">
      {message}
    </div>
  );
}
