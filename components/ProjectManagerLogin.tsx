import React, { useState } from 'react';
import { projectManagerLogin } from '../services/api';

export const ProjectManagerLogin: React.FC = () => {
  const [projectId, setProjectId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!projectId.trim() || !password.trim()) {
      setError("Veuillez saisir l'ID du projet et le mot de passe du projet.");
      return;
    }

    setSubmitting(true);
    try {
      const session = await projectManagerLogin(projectId.trim(), password.trim());
      sessionStorage.setItem('sila_project_session', JSON.stringify(session));
      window.location.href = '/projet/panel';
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connexion au projet échouée.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Province de Sila</span>
            <p className="text-xs sm:text-sm font-bold text-blue-900 leading-tight">
              Espace Responsable de Projet
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              window.location.href = '/';
            }}
            className="text-xs font-medium text-blue-900 hover:underline"
          >
            Retour au Portail Partenaires
          </button>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md border border-gray-200 p-6 space-y-6">
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-2">Connexion Responsable de Projet</h1>
            <p className="text-xs text-gray-500">
              Accès réservé aux responsables de projets, via l'ID du projet et le mot de passe transmis par email.
            </p>
          </div>

          {error && (
            <div className="mb-3 rounded-md bg-red-50 p-3 border border-red-100 text-xs text-red-700">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-gray-700">ID du projet</label>
              <input
                type="text"
                disabled={submitting}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-900 focus:border-blue-900"
                placeholder="Ex: PRJ-XXXXXX"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Mot de passe du projet</label>
              <input
                type="password"
                disabled={submitting}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-900 focus:border-blue-900"
                placeholder="Mot de passe reçu par email"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-blue-900 text-sm font-semibold rounded-md text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-900 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Connexion...' : 'Accéder au projet'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
