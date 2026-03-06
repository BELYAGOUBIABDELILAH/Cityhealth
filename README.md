<div align="center">

<!-- LOGO / BANNER -->
<img src="https://img.shields.io/badge/CityHealth-Plateforme%20Santé%20Digitale-2563EB?style=for-the-badge&logo=heart&logoColor=white" alt="CityHealth Banner" />

<br/>
<br/>

# 🏥 CityHealth
### *La première plateforme digitale de santé de Sidi Bel Abbès, Algérie*

<br/>

[![Live Platform](https://img.shields.io/badge/🌐%20Plateforme%20Live-cityhealth--dz.lovable.app-2563EB?style=for-the-badge)](https://cityhealth-dz.lovable.app)
[![Version](https://img.shields.io/badge/Version-1.0-10B981?style=for-the-badge)](#)
[![Progress](https://img.shields.io/badge/Progression-90%25-F59E0B?style=for-the-badge)](#)
[![Languages](https://img.shields.io/badge/Langues-FR%20%7C%20AR%20%7C%20EN-06B6D4?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/License-MIT-gray?style=for-the-badge)](#)

<br/>

> **CityHealth** connecte en temps réel les citoyens de Sidi Bel Abbès avec les professionnels de santé locaux.  
> Recherche intelligente · Carte interactive · Assistant IA · Données vérifiées · 100% Gratuit pour les patients.

<br/>

---

</div>

## 📋 Table des Matières

- [🎯 À Propos](#-à-propos)
- [✨ Fonctionnalités Clés](#-fonctionnalités-clés)
- [👥 Types d'Utilisateurs](#-types-dutilisateurs)
- [🗺️ Carte Interactive](#️-carte-interactive)
- [🤖 Assistant IA Santé](#-assistant-ia-santé)
- [⚙️ Stack Technique](#️-stack-technique)
- [🚀 Accès à la Plateforme](#-accès-à-la-plateforme)
- [👨‍💻 L'Équipe](#-léquipe)
- [📬 Contact](#-contact)

---

## 🎯 À Propos

Avant CityHealth, un citoyen de Sidi Bel Abbès cherchant un médecin spécialiste, une pharmacie de garde, ou un laboratoire d'analyses devait appeler plusieurs numéros, se déplacer sans certitude, et naviguer des informations éparpillées et souvent obsolètes.

**CityHealth résout ce problème.**

C'est un **écosystème digital de santé** composé d'une plateforme web, d'une extension Chrome et d'une API publique — centralisant toutes les informations de santé de Sidi Bel Abbès au même endroit, avec intelligence et fiabilité.

```
  Le patient cherche  →  La plateforme trouve  →  Il est orienté en confiance
```

| Avant CityHealth | Avec CityHealth |
|---|---|
| 🔴 Recherche longue et frustrante | ✅ Résultats en quelques secondes |
| 🔴 Informations éparpillées et fausses | ✅ Données centralisées et vérifiées |
| 🔴 Urgences mal orientées | ✅ Localisation immédiate sur carte |
| 🔴 Prestataires sans présence digitale | ✅ Profils professionnels visibles |
| 🔴 Aucune aide à l'orientation médicale | ✅ Assistant IA disponible 24h/24 |

---

## ✨ Fonctionnalités Clés

### 🔍 Pour les Patients / Citoyens

| Fonctionnalité | Description |
|---|---|
| **Recherche Intelligente** | Trouvez un médecin, clinique ou pharmacie en quelques secondes par nom, spécialité, zone ou langue |
| **Carte Interactive** | Visualisez tous les prestataires en temps réel (3 modes : soins, urgences, don de sang) |
| **Géolocalisation** | CityHealth détecte votre position et indique les prestataires les plus proches |
| **Assistant IA Santé** | Posez vos questions de santé en FR/AR/EN — disponible 24h/24 |
| **Fiches Détaillées** | Horaires, coordonnées, spécialités, langues parlées, équipements |
| **Urgences 24/7** | Section dédiée aux structures disponibles en permanence |
| **Favoris** | Sauvegardez vos prestataires préférés (compte requis) |

### 🏥 Catégories de Prestataires

```
🏨 Hôpitaux Généraux         🤰 Maternités               🏥 Cliniques Privées
👨‍⚕️ Médecins Généralistes    👩‍⚕️ Médecins Spécialistes   💊 Pharmacies
🔬 Laboratoires d'Analyses   📡 Centres de Radiologie    🩸 Centres de Don de Sang
🦷 Centres Dentaires         👁️ Ophtalmologie            🦽 Kinésithérapie
🛒 Équipements Médicaux      🚨 Services d'Urgence 24/7
```

### 🏪 Pour les Prestataires de Santé

- **Profil professionnel complet** — logo, description, galerie photos, horaires, spécialités
- **Score de complétude** — indicateur de progression pour maximiser la visibilité
- **Badge de vérification** — label de confiance visible par tous les utilisateurs
- **Tableau de bord analytics** — vues de profil, contacts, favoris
- **Système de publicité** — création d'annonces pour les prestataires vérifiés
- **Gestion des rendez-vous** — calendrier et suivi des demandes

### 🔧 Pour les Développeurs — API REST Publique

```http
GET /api/providers          # Liste des prestataires vérifiés
GET /api/pharmacies/garde   # Pharmacies de garde en temps réel
GET /api/urgences           # Structures d'urgence 24h/24
```

> Authentification par token · Documentation claire · Données santé locales structurées

### 🔌 Extension Chrome

Accès instantané sans ouvrir la plateforme :
- ⚡ Triage IA instantané vers le bon prestataire
- 🔍 Recherche rapide sans quitter votre navigation  
- 🩸 Alertes don de sang en temps réel

---

## 👥 Types d'Utilisateurs

```
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│  👤 CITOYEN     │    │  🏥 PRESTATAIRE       │    │  🛡️ ADMIN       │
│                 │    │                      │    │                 │
│ • Recherche     │    │ • Gestion profil     │    │ • Vérifications │
│ • Carte & GPS   │    │ • Rendez-vous        │    │ • Modération    │
│ • Favoris       │    │ • Analytics          │    │ • Import bulk   │
│ • Assistant IA  │    │ • Publicités         │    │ • Statistiques  │
│ • Gratuit ✓    │    │ • Badge vérifié ✓    │    │ • Configuration │
└─────────────────┘    └──────────────────────┘    └─────────────────┘
```

> 🔒 **Visibilité publique :** Les prestataires non vérifiés ne sont pas visibles sur la plateforme. Seuls les profils validés par l'équipe CityHealth obtiennent un badge de confiance et une visibilité complète.

---

## 🗺️ Carte Interactive

La carte temps réel de CityHealth offre :

- **Marqueurs par type** de prestataire avec icônes distinctives
- **Clustering intelligent** pour les zones denses  
- **Filtres en temps réel** (type, accessibilité, disponibilité 24/7)
- **Popup d'information** — nom, adresse, téléphone, badge vérifié, lien profil
- **Intégration GPS** — distance et itinéraire depuis votre position
- **Mode nuit** — pharmacies de garde mises en avant
- **Mode urgence** — structures critiques prioritaires

---

## 🤖 Assistant IA Santé

CityHealth intègre **deux assistants IA** distincts :

### 1. 🩺 Assistant Médical (`/medical-assistant`)
Conçu pour guider les patients avec des informations de santé fiables :
- Vérificateur de symptômes (avec avertissements appropriés)
- Conseils santé & premiers secours
- Recommandation du bon type de prestataire selon les besoins
- Historique des conversations (utilisateurs connectés)
- Multilingue : Français · Arabe · Anglais

### 2. 💬 Chatbot Plateforme (widget global)
Assistance à la navigation sur la plateforme :
- Comment utiliser CityHealth
- Aide à la recherche
- Onboarding des prestataires
- FAQ et informations de contact

---

## ⚙️ Stack Technique

<div align="center">

| Couche | Technologies |
|---|---|
| **Frontend** | React.js · Next.js · TypeScript · Tailwind CSS · shadcn/ui |
| **Backend** | Node.js · Python (FastAPI) · REST API |
| **Base de données** | Super base  · Firebase · Redis (cache) |
| **Fichiers & Images** | Lovbale · Cloudinary |
| **Cartographie** | Google Maps API |
| **IA** | OpenAI API · Gemini API |
| **Auth** | JWT · OAuth 2.0 (Google) |
| **Notifications** | SendGrid (email) |
| **Standards** |  RTL (Arabe) · PWA |

</div>

---

## 🚀 Accès à la Plateforme

<div align="center">


### 🌐 [cityhealth-dz.lovable.app](https://cityhealth-dz.lovable.app)


</div>

> 📱 Compatible mobile, tablette et desktop · Chargement <3s sur connexion 3G · Navigateurs : Chrome, Firefox, Safari, Edge

---

## 🗓️ Feuille de Route

| Phase | Statut | Description |
|---|---|---|
| Phase 1 — Fondation | ✅ Terminé | Base de données, auth, profils |
| Phase 2 — Recherche & Filtres | ✅ Terminé | Recherche avancée, cartes prestataires |
| Phase 3 — Cartographie | ✅ Terminé | Carte interactive complète |
| Phase 4 — IA | ✅ Terminé | Assistants IA médicaux et plateforme |
| Phase 5 — Profils & RDV | ✅ Terminé | Rendez-vous, dossier santé |
| Phase 6 — Publicités | ✅ Terminé | Système d'annonces |
| Phase 7 — Admin | ✅ Terminé | Tableau de bord administrateur |
| Phase 8 — Fonctions Spéciales | ✅ Terminé | Médicaments gratuits, urgences |
| Phase 9 — Accessibilité | 🔄 En cours | WCAG 2.1 AA, RTL complet |
| Phase 10-12 — Lancement | 🔄 En cours | Tests, optimisation, déploiement |

**Progression globale : █████████████████░ 90%**

---

## 👨‍💻 L'Équipe

<div align="center">

| | Nom | Rôle | GitHub | LinkedIn |
|---|---|---|---|---|
| 👤 | **Belyagoubi Abdelilah** | Co-Founder and Chief Technology Officer | — | — |
| 👤 | **Naimi Abdeljalil** | Co-fondateur & Développeur | — | — |


</div>

> 📍 Sidi Bel Abbès, Algérie · 🎓 Projet académique & entrepreneurial · 2025

---

## 📬 Contact

<div align="center">

| Canal | Lien |
|---|---|
| 🌐 **Plateforme** | [cityhealth-dz.lovable.app](https://cityhealth-dz.lovable.app) |
| 📧 **Email** | contact@cityhealth-dz.com |
| 📧 **Support** | support@cityhealth-dz.com |
| 📍 **Localisation** | Sidi Bel Abbès, Wilaya 22, Algérie |

</div>

---

<div align="center">

### 🌟 CityHealth — *Votre santé, simplifiée.*

*Première infrastructure de santé numérique de Sidi Bel Abbès*  
*Construite pour les citoyens · Vérifiée par l'équipe CityHealth · Gratuite pour tous*

<br/>

[![Made in Algeria](https://img.shields.io/badge/Made%20in-Algeria%20🇩🇿-2563EB?style=flat-square)](#)
[![Healthcare](https://img.shields.io/badge/Secteur-Santé%20Digitale-10B981?style=flat-square)](#)
[![Version](https://img.shields.io/badge/Version-1.0%20•%202025-F59E0B?style=flat-square)](#)

<br/>

*© 2025 CityHealth · Belyagoubi Abdelilah & Naimi Abdeljalil · Tous droits réservés*

</div>
