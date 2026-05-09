import AgentDetailClient from './AgentDetailClient'

// Static export requires generateStaticParams. We pre-render only a placeholder;
// any other id is handled client-side via useParams() at runtime.
export async function generateStaticParams() {
  return [{ id: 'placeholder' }]
}

export default function AgentDetailPage() {
  return <AgentDetailClient />
}
