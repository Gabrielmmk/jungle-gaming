import { Button } from '@/components/ui/button'

function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink">
      <h1 className="text-heading text-text-primary">GreenMint</h1>
      <p className="text-body text-text-secondary">Foundation theme pipeline check.</p>
      <Button variant="default">Explore marketplace</Button>
    </main>
  )
}

export default App
