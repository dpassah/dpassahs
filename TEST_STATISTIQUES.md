# Test des Statistiques - Instructions

## ✅ Ce qui a été fait:

### 1. **Structure de données modifiée:**
   - Les statistiques mensuelles de la province sont maintenant **calculées automatiquement** à partir des données des sites
   - Lecture depuis la table `site_monthly_stats` et agrégation par mois/année
   - Plus besoin d'entrer manuellement les totaux de la province

### 2. **Données de test insérées:**
   - ✓ Statistiques structurelles (population, handicapés, vulnérables, etc.)
   - ✓ 4 sites de test:
     - Camp Goz Beida (réfugiés)
     - Camp Kounoungou (réfugiés)
     - Village Hôte Adré (village hôte)
     - Zone Retour Tiné (retournés)
   - ✓ Statistiques mensuelles pour novembre 2024 pour chaque site

### 3. **Calculs automatiques:**
   - **Total Réfugiés** = Somme de `ref_total_ind` de tous les sites
   - **Nouveaux Réfugiés** = Somme de `ref_new_ind` de tous les sites
   - **Total Retournés** = Somme de `ret_total_ind` de tous les sites
   - **Nouveaux Retournés** = Somme de `ret_new_ind` de tous les sites

## 🧪 Comment tester:

### Option 1: Via le serveur de développement
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd ..
npm run dev
```

Ensuite, ouvrez: `http://localhost:5173` et allez à la page "Statistiques"

### Option 2: Via le build de production
```bash
# Démarrer le backend
cd backend
npm start

# Dans un autre terminal, servir le frontend
cd ..
npm run preview
```

## 📊 Résultats attendus:

### Données Sociales:
- Population Totale: **185,000**
- Handicapées: **5,200**
- Vulnérables: **12,000**
- Inondations: **3,500**
- Incendies: **1,200**

### Évolution Mensuelle (Novembre 2024):
- Total Réfugiés: **15,000** (8,500 + 6,500 des sites)
- Nouveaux Réfugiés: **500** (300 + 200 des sites)
- Total Retournés: **8,000** (du site 4)
- Nouveaux Retournés: **200** (du site 4)

## 🔧 Réinitialiser les données:

Si vous voulez réinsérer les données de test:
```bash
cd backend
npm run seed-data
```

## 📝 Notes importantes:

1. **Ajout de nouvelles données**: Maintenant, il suffit d'ajouter les statistiques de sites dans `site_monthly_stats`. Les totaux provinciaux seront calculés automatiquement.

2. **Ancienne table `province_stats`**: Cette table existe toujours mais n'est plus utilisée. Vous pouvez la supprimer si vous voulez, ou la garder pour référence.

3. **Nouveau tableau `province_monthly_stats`**: Créé mais non utilisé actuellement. Le calcul se fait dynamiquement depuis `site_monthly_stats`.

## 🐛 Dépannage:

### Si "Aucune donnée mensuelle disponible" s'affiche:
1. Vérifiez que le backend est bien démarré
2. Vérifiez qu'il n'y a pas d'erreurs dans la console du backend
3. Réexécutez le script de données: `npm run seed-data` dans le dossier backend
4. Vérifiez que la table `site_monthly_stats` contient des données:
   ```sql
   SELECT * FROM site_monthly_stats;
   ```

### Si les totaux sont à 0:
1. Vérifiez que les colonnes `ref_total_ind` et `ret_total_ind` existent dans `site_monthly_stats`
2. Vérifiez que les valeurs ne sont pas NULL
