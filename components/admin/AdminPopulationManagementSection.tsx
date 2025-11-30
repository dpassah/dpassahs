import React, { useEffect, useState } from 'react';
import { Save, Users, AlertTriangle, Flame, Droplets, UserX } from 'lucide-react';
import {
  adminGetProvinceStructuralStats,
  adminSaveProvinceStructuralStats,
  ProvinceStructuralStats,
} from '../../services/api';

interface AdminPopulationProps {
  SectionHeader: any;
  ActionButton: any;
  inputClassName: string;
  labelClassName: string;
}

export const AdminPopulationManagementSection: React.FC<AdminPopulationProps> = ({
  SectionHeader,
  ActionButton,
  inputClassName,
  labelClassName,
}) => {
  const [populationData, setPopulationData] = useState<ProvinceStructuralStats>({
    populationTotal: 0,
    disabledTotal: 0,
    floodAffected: 0,
    fireAffected: 0,
    veryVulnerable: 0,
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadPopulationData = async () => {
      setLoading(true);
      try {
        const data = await adminGetProvinceStructuralStats();
        if (data) {
          setPopulationData(data);
          // Set last updated date (this would ideally come from the API)
          setLastUpdated(new Date().toLocaleDateString('fr-FR'));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données population:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPopulationData();
  }, []);

  const handleInputChange = (field: keyof ProvinceStructuralStats, value: string) => {
    const numValue = value === '' ? 0 : Number(value);
    setPopulationData(prev => ({
      ...prev,
      [field]: isNaN(numValue) ? 0 : numValue
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await adminSaveProvinceStructuralStats(populationData);
      setLastUpdated(new Date().toLocaleDateString('fr-FR'));
      alert('Données population mises à jour avec succès !');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde des données');
    } finally {
      setIsSaving(false);
    }
  };

  const populationStats = [
    {
      field: 'populationTotal' as keyof ProvinceStructuralStats,
      label: 'Population Totale',
      icon: Users,
      color: 'blue',
      description: 'Nombre total d\'habitants dans la province'
    },
    {
      field: 'disabledTotal' as keyof ProvinceStructuralStats,
      label: 'Personnes Handicapées',
      icon: UserX,
      color: 'purple',
      description: 'Nombre total de personnes en situation de handicap'
    },
    {
      field: 'floodAffected' as keyof ProvinceStructuralStats,
      label: 'Affectés par les Inondations',
      icon: Droplets,
      color: 'cyan',
      description: 'Nombre de personnes affectées par les inondations'
    },
    {
      field: 'fireAffected' as keyof ProvinceStructuralStats,
      label: 'Affectés par les Incendies',
      icon: Flame,
      color: 'orange',
      description: 'Nombre de personnes affectées par les incendies'
    },
    {
      field: 'veryVulnerable' as keyof ProvinceStructuralStats,
      label: 'Personnes Très Vulnérables',
      icon: AlertTriangle,
      color: 'red',
      description: 'Nombre de personnes considérées comme très vulnérables'
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Chargement des données population...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Gestion des Données Population"
        subtitle="Suivi des statistiques démographiques et des populations vulnérables"
        action={
          <ActionButton
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#002060] text-white px-6 py-2"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </ActionButton>
        }
      />

      {lastUpdated && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-600">
            <span className="font-semibold">Dernière mise à jour:</span> {lastUpdated}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {populationStats.map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'border-blue-200 bg-blue-50/20 focus:border-blue-500 focus:ring-blue-500',
            purple: 'border-purple-200 bg-purple-50/20 focus:border-purple-500 focus:ring-purple-500',
            cyan: 'border-cyan-200 bg-cyan-50/20 focus:border-cyan-500 focus:ring-cyan-500',
            orange: 'border-orange-200 bg-orange-50/20 focus:border-orange-500 focus:ring-orange-500',
            red: 'border-red-200 bg-red-50/20 focus:border-red-500 focus:ring-red-500',
          };

          return (
            <div key={stat.field} className={`border rounded-lg p-6 ${colorClasses[stat.color]}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                  <Icon className={`w-5 h-5 text-${stat.color}-600`} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">{stat.label}</h3>
                  <p className="text-xs text-gray-500">{stat.description}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <input
                  type="number"
                  min="0"
                  value={populationData[stat.field] || ''}
                  onChange={(e) => handleInputChange(stat.field, e.target.value)}
                  className={`${inputClassName} text-center text-xl font-bold border-2 ${colorClasses[stat.color]}`}
                  placeholder="0"
                />
                <div className="text-center">
                  <span className={`text-xs font-semibold text-${stat.color}-700 uppercase`}>
                    {populationData[stat.field]?.toLocaleString('fr-FR') || '0'} personnes
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="font-bold text-gray-800 text-sm uppercase">Résumé des Données</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 text-sm border-b border-gray-200 pb-2">Statistiques Démographiques</h4>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Population Totale:</span>
                <span className="font-bold text-blue-700">{populationData.populationTotal?.toLocaleString('fr-FR') || '0'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Personnes Handicapées:</span>
                <span className="font-bold text-purple-700">{populationData.disabledTotal?.toLocaleString('fr-FR') || '0'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Personnes Très Vulnérables:</span>
                <span className="font-bold text-red-700">{populationData.veryVulnerable?.toLocaleString('fr-FR') || '0'}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 text-sm border-b border-gray-200 pb-2">Impact des Catastrophes</h4>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Affectés par Inondations:</span>
                <span className="font-bold text-cyan-700">{populationData.floodAffected?.toLocaleString('fr-FR') || '0'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Affectés par Incendies:</span>
                <span className="font-bold text-orange-700">{populationData.fireAffected?.toLocaleString('fr-FR') || '0'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-t pt-2">
                <span className="text-sm font-semibold text-gray-700">Total Affectés:</span>
                <span className="font-bold text-red-700">
                  {((populationData.floodAffected || 0) + (populationData.fireAffected || 0)).toLocaleString('fr-FR')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-gray-500 bg-gray-50 rounded-lg p-4">
        <p className="font-semibold mb-1">Instructions</p>
        <p>Entrez les nombres dans les champs ci-dessus et cliquez sur "Sauvegarder" pour mettre à jour les données population.</p>
        <p>Ces données sont utilisées pour les rapports statistiques et le suivi des populations vulnérables.</p>
      </div>
    </div>
  );
};
