'use client';

import { clearToken } from '../lib/api';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();

  function handleLogout() {
    clearToken();
    router.push('/login');
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 bg-gradient-to-b from-night to-transparent">
      <a href="/">
        <img src="/logo.png" alt="Avioli Stream" className="h-8 w-auto" />
      </a>
      <nav className="flex items-center gap-6 text-sm text-muted">
        <a href="/" className="hover:text-ink transition-colors">Catalogue</a>
        <a href="/ma-liste" className="hover:text-ink transition-colors">Ma liste</a>
        <button onClick={handleLogout} className="hover:text-ink transition-colors">
          Déconnexion
        </button>
      </nav>
    </header>
  );
}
