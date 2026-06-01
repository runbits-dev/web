import QaRunDetailClient from './Client'

// Static export requires generateStaticParams. We pre-render only a placeholder;
// any other run id is resolved client-side via useParams() at runtime.
export async function generateStaticParams() {
  return [{ id: 'placeholder' }]
}

export default function QaRunDetailPage() {
  return <QaRunDetailClient />
}
