import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return <div className="w-full mx-auto p-4">Coming soon!</div>
}