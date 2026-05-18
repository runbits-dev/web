import NodeDetailClient from './Client'

// Static export requires generateStaticParams. We pre-render only a placeholder;
// any other resource id is handled client-side via useParams() at runtime.
export async function generateStaticParams() {
  return [{ id: 'placeholder' }]
}

export default function PulseNodeDetailPage() {
  return <NodeDetailClient />
}
