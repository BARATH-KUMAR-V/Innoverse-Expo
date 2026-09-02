import ProductDetailClient from "./ProductDetailClient";

// Next.js 15 passes dynamic route params as a Promise to Server Components -
// this thin server wrapper awaits it once and hands the plain string down to
// the client component that does the actual data fetching and rendering.
export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductDetailClient id={id} />;
}
