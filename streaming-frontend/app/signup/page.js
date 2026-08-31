'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setToken } from '../../lib/api';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profileName, setProfileName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.signup({ email, password, profileName: profileName || undefined });
      setToken(data.token);
      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <img src="/logo.png" alt="Avioli Stream" className="h-10 w-auto mx-auto mb-8" />
        <form onSubmit={handleSubmit} className="bg-surface rounded-lg p-8 flex flex-col gap-4">
          <h2 className="font-display uppercase tracking-wide text-xl mb-2">Créer un compte</h2>

          {error && <p className="text-alert text-sm">{error}</p>}

          <input
            type="email"
            placeholder="Adresse email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-surfaceLight rounded px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="password"
            placeholder="Mot de passe (8 caractères min.)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="bg-surfaceLight rounded px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text"
            placeholder="Nom du profil (optionnel)"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            className="bg-surfaceLight rounded px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white font-medium rounded px-4 py-3 mt-2 hover:brightness-110 transition disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>

          <p className="text-sm text-muted text-center mt-2">
            Déjà un compte ?{' '}
            <a href="/login" className="text-primary hover:underline">
              Connecte-toi
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
