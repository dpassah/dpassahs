import React, { useState } from 'react';
import { adminLogin } from '../services/api';

export const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('DPASSAHS');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Veuillez saisir le nom utilisateur et le mot de passe.');
      return;
    }

    setLoading(true);
    try {
      await adminLogin(username.trim(), password);
      setPassword('');
      window.location.href = '/admin/panel';
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Échec de la connexion admin.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 flex flex-col font-sans text-white">
      {/* Bande supérieure avec lien retour */}
      <header className="px-4 sm:px-6 lg:px-8 pt-4 pb-6 max-w-4xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-800/70 border border-slate-600 text-[10px] font-bold tracking-wider">
            ADM
          </span>
          <div className="leading-tight">
            <p className="text-xs font-semibold text-slate-200 uppercase tracking-[0.18em]">
              Espace Administration
            </p>
            <p className="text-[11px] text-slate-400">
              Accès réservé à la DPASSAHS (gestion centrale du registre)
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            window.location.href = '/';
          }}
          className="text-[11px] font-medium text-slate-200 hover:text-white hover:underline"
        >
          Retour au Portail
        </button>
      </header>

      {/* Fond décoratif */}
      <div className="flex-1 w-full flex items-end justify-center pb-0">
        <div className="relative w-full max-w-xl px-4 sm:px-6 lg:px-8">
          {/* Hint/texte au-dessus من الإطار */}
          <div className="mb-4 text-xs text-slate-300 max-w-md">
            <p>
              Veuillez saisir les identifiants fournis à la Délégation Provinciale pour accéder au panneau
              d&apos;administration.
            </p>
          </div>

          {/* Bottom sheet */}
          <div className="bg-white text-slate-900 rounded-t-2xl shadow-2xl border border-slate-200 border-b-0 pt-4 pb-6 px-4 sm:px-6 transform translate-y-0 transition-transform duration-300 ease-out">
            <div className="mx-auto max-w-md space-y-5">
              {/* Handle */}
              <div className="flex justify-center mb-1">
                <span className="inline-block w-10 h-1.5 rounded-full bg-slate-200" />
              </div>

              <div className="text-center">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">
                  Connexion Administration DPASSAHS
                </h1>
                <p className="text-[11px] text-slate-500">
                  Interface sécurisée pour la gestion des organisations, projets, activités et statistiques.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nom d&apos;utilisateur</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mot de passe</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 bg-white"
                  />
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 p-3 border border-red-100 text-[11px] text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-md text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                >
                  {loading ? 'Connexion...' : 'Se connecter'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
