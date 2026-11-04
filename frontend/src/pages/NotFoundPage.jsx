import { Link } from 'react-router-dom'
import { Leaf, ArrowLeft, Home } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Container from '../components/Container'
import Button from '../components/Button'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col min-h-screen bg-paper text-ink">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-24">
        <Container size="narrow">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-pine/10 text-pine flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Leaf className="w-8 h-8" />
            </div>

            <p className="font-mono text-sm uppercase tracking-widest text-pine font-semibold mb-2">
              404 — Page Not Found
            </p>

            <h1 className="text-3xl md:text-4xl font-display font-semibold text-ink mb-4">
              Peace of mind is still here.
            </h1>

            <p className="text-ink-soft mb-8 leading-relaxed">
              The page you are looking for doesn't exist or has been moved. Take a deep breath and let's get you back on track.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button variant="primary" to="/" className="w-full sm:w-auto justify-center gap-2">
                <Home className="w-4 h-4" />
                Return Home
              </Button>
              <Button variant="secondary" to="/assessment" className="w-full sm:w-auto justify-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Take Assessment
              </Button>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  )
}
