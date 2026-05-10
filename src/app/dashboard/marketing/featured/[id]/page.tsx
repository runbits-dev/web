import FeaturedDetailClient from './FeaturedDetailClient'

// Static export requires generateStaticParams. We pre-render only a placeholder;
// any other id is handled client-side via useParams() at runtime.
export async function generateStaticParams() {
  return [{ id: 'placeholder' }]
}

export default function FeaturedDetailPage() {
  return <FeaturedDetailClient />
}
