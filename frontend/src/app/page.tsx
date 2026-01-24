import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">DÉLICES AFRO-CARAÏBE</h1>
          <nav className="flex gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Connexion</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Inscription</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold mb-6">
            Savourez les délices de l'Afrique et des Caraïbes
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Commandez vos plats préférés auprès des meilleurs restaurants et faites-vous livrer rapidement.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/restaurants">
              <Button size="lg">Explorer les restaurants</Button>
            </Link>
            <Link href="/auth/register?role=restaurateur">
              <Button size="lg" variant="outline">Devenir partenaire</Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="text-center p-6 border rounded-lg">
            <div className="text-4xl mb-4">🍽️</div>
            <h3 className="text-xl font-semibold mb-2">Large sélection</h3>
            <p className="text-muted-foreground">
              Découvrez une variété de cuisines afro-caribéennes authentiques
            </p>
          </div>
          <div className="text-center p-6 border rounded-lg">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold mb-2">Livraison rapide</h3>
            <p className="text-muted-foreground">
              Recevez vos commandes chaudes et fraîches à domicile
            </p>
          </div>
          <div className="text-center p-6 border rounded-lg">
            <div className="text-4xl mb-4">💳</div>
            <h3 className="text-xl font-semibold mb-2">Paiement sécurisé</h3>
            <p className="text-muted-foreground">
              Payez en toute sécurité avec plusieurs options de paiement
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2026 DÉLICES AFRO-CARAÏBE. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}
