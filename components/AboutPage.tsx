import React from 'react';
import { PublicLayout } from './PublicLayout';

export const AboutPage: React.FC = () => {
  return (
    <PublicLayout>
      <section className="py-16 bg-gray-50 flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl space-y-8">
            {/* Titre + intro courte */}
            <header>
              <h1 className="text-3xl font-extrabold text-[#002060] mb-3">
                À propos de la Délégation Provinciale
              </h1>
              <p className="text-sm text-gray-600 leading-relaxed max-w-3xl">
                La Délégation Provinciale de l'Action Sociale, de la Solidarité Nationale et des Affaires Humanitaires
                de la province de Sila est le bras opérationnel du Ministère au niveau provincial : elle coordonne,
                suit et appuie les interventions sociales et humanitaires sur l'ensemble du territoire de la province.
              </p>
            </header>

            {/* Cartes synthétiques */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Cadre juridique */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                <h2 className="text-sm font-bold text-[#002060] mb-2 uppercase tracking-wide">
                  Cadre juridique
                </h2>
                <p className="text-xs text-gray-600 leading-relaxed">
                  La Délégation est un service déconcentré du Ministère, organisé par le Décret N° 0523/PT/PM/MASSNAH/2024
                  et l'Arrêté N° 020/PR/PM/MASSAH/SG/DRHF/2024. Elle agit sous l'autorité directe du Secrétaire Général
                  du Ministère.
                </p>
              </div>

              {/* Rôle dans la province */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                <h2 className="text-sm font-bold text-[#002060] mb-2 uppercase tracking-wide">
                  Rôle dans la province
                </h2>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Elle met en œuvre la politique nationale d'action sociale, de solidarité et d'affaires humanitaires,
                  coordonne les acteurs sur le terrain et veille à la protection des populations vulnérables dans toute
                  la province de Sila.
                </p>
              </div>

              {/* Organisation interne */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                <h2 className="text-sm font-bold text-[#002060] mb-2 uppercase tracking-wide">
                  Organisation interne
                </h2>
                <p className="text-xs text-gray-600 leading-relaxed">
                  La Délégation s'articule autour d'un Chef de Bureau et de plusieurs divisions (Action Sociale et
                  Solidarité, Affaires Humanitaires, Finances et Matériels, Programmation/ Suivi/ Évaluation, Services
                  Spéciaux) pour couvrir l'ensemble des missions techniques et de gestion.
                </p>
              </div>

              {/* Gouvernance et coordination */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                <h2 className="text-sm font-bold text-[#002060] mb-2 uppercase tracking-wide">
                  Gouvernance et coordination
                </h2>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Le Délégué Provincial, ayant rang de Directeur Technique, anime et pilote les services, coordonne
                  les réponses aux crises, assure le suivi et l'évaluation des activités, et rend compte aux autorités
                  centrales et provinciales.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};
