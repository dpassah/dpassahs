import React, { useState } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { PublicLayout } from './PublicLayout';
import { sendContactMessage } from '../services/api';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setSubmitting(true);
    try {
      await sendContactMessage(name.trim(), email.trim(), message.trim());
      setSuccess('Votre message a été envoyé. Merci.');
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Une erreur s'est produite lors de l'envoi du message.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <section className="py-16 bg-gradient-to-b from-gray-50 to-gray-100 flex-grow">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="max-w-3xl mb-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#002060] mb-3 tracking-tight">
              Contact
            </h1>
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Pour toute question, information complémentaire ou coordination avec la Délégation Provinciale
              de l'Action Sociale, de la Solidarité Nationale et des Affaires Humanitaires de la province de Sila,
              vous pouvez utiliser les coordonnées ci-dessous.
            </p>
          </header>

          <div className="grid gap-8 md:grid-cols-2 items-start">
            {/* Colonne coordonnées */}
            <div className="bg-white/90 border border-gray-200 rounded-xl shadow-md px-6 py-5 space-y-4">
              <h2 className="text-sm font-bold text-[#002060] uppercase tracking-wide flex items-center gap-2">
                <span className="w-1.5 h-5 bg-[#FECB00] rounded-full" />
                Coordonnées de la Délégation
              </h2>
              <p className="text-[11px] text-gray-600">
                Merci de privilégier ces canaux pour toute prise de contact institutionnelle ou technique avec la
                Délégation Provinciale.
              </p>
              <div className="space-y-3 pt-1 text-xs text-gray-700">
                <p className="flex items-start gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#C60C30]/10 text-[#C60C30]">
                    <MapPin className="h-3.5 w-3.5" />
                  </span>
                  <span>
                    Goz Beïda, Province de Sila<br />
                    République du Tchad
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#002060]/10 text-[#002060]">
                    <Phone className="h-3.5 w-3.5" />
                  </span>
                  <span>+235 66 00 00 00</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#002060]/10 text-[#002060]">
                    <Mail className="h-3.5 w-3.5" />
                  </span>
                  <span>dpassahs@gmail.com</span>
                </p>
              </div>
            </div>

            {/* Colonne formulaire */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 px-6 py-5">
              <h2 className="text-sm font-bold text-[#002060] uppercase tracking-wide mb-1">
                Écrire à la Délégation
              </h2>
              <p className="text-[11px] text-gray-600 mb-3">
                Ce formulaire est indicatif. Pour les démarches officielles, veuillez utiliser les canaux
                administratifs habituels.
              </p>
              {success && (
                <p className="mb-2 text-[11px] text-green-700 bg-green-50 border border-green-100 rounded px-2 py-1">
                  {success}
                </p>
              )}
              {error && (
                <p className="mb-2 text-[11px] text-red-700 bg-red-50 border border-red-100 rounded px-2 py-1">
                  {error}
                </p>
              )}
              <form className="space-y-3 text-xs" onSubmit={handleSubmit}>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Nom & Organisation</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#002060] focus:border-[#002060] text-xs md:text-sm"
                    placeholder="Nom complet / Structure"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Adresse e-mail</label>
                  <input
                    type="email"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#002060] focus:border-[#002060] text-xs md:text-sm"
                    placeholder="vous@example.td"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Message</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-md px-3 py-2 h-28 resize-none focus:outline-none focus:ring-1 focus:ring-[#002060] focus:border-[#002060] text-xs md:text-sm"
                    placeholder="Votre message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
                <div className="pt-1 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center px-5 py-2 bg-[#002060] text-white font-bold rounded-md text-xs md:text-sm hover:bg-[#003da5] transition-colors disabled:opacity-60"
                  >
                    {submitting ? 'Envoi...' : 'Envoyer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};
