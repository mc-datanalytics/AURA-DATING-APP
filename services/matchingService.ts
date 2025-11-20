
import { AttachmentStyle, UserProfile, CompatibilityDetails, DynamicAura } from '../types';

/**
 * AURA MATCHING ENGINE v3.0 - "The Karmic Judge"
 * 
 * Complexité cachée :
 * 1. Matrice MBTI (Socionique simplifiée)
 * 2. Compatibilité d'Attachement (Théorie de l'attachement)
 * 3. Jaccard Index pour les intérêts (Lifestyle)
 * 4. Vecteurs d'Aura Dynamique (Comportemental)
 */

// --- 1. MATRICE MBTI COMPLEXE ---
const MBTI_GROUPS = {
    ANALYSTS: ['INTJ', 'INTP', 'ENTJ', 'ENTP'],
    DIPLOMATS: ['INFJ', 'INFP', 'ENFJ', 'ENFP'],
    SENTINELS: ['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'],
    EXPLORERS: ['ISTP', 'ISFP', 'ESTP', 'ESFP']
};

const getMBTIScore = (m1: string, m2: string): number => {
    // Golden Pairs (Socionics Duals - highly compatible opposites)
    const isGoldenPair = (
        (m1 === 'INTJ' && m2 === 'ENFP') || (m1 === 'ENFP' && m2 === 'INTJ') ||
        (m1 === 'INFJ' && m2 === 'ENTP') || (m1 === 'ENTP' && m2 === 'INFJ') ||
        (m1 === 'ISTJ' && m2 === 'ESFP') || (m1 === 'ESFP' && m2 === 'ISTJ') ||
        (m1 === 'ISFJ' && m2 === 'ESTP') || (m1 === 'ESTP' && m2 === 'ISFJ') ||
        (m1 === 'ENTJ' && m2 === 'INFP') || (m1 === 'INFP' && m2 === 'ENTJ')
    );
    if (isGoldenPair) return 98;

    // Silver Pairs (Keirsey Temperaments)
    const g1 = Object.values(MBTI_GROUPS).find(g => g.includes(m1));
    const g2 = Object.values(MBTI_GROUPS).find(g => g.includes(m2));
    
    // NF + NT = Great intellectual stimulation
    if ((g1 === MBTI_GROUPS.ANALYSTS && g2 === MBTI_GROUPS.DIPLOMATS) || 
        (g1 === MBTI_GROUPS.DIPLOMATS && g2 === MBTI_GROUPS.ANALYSTS)) return 88;

    // Same group = Good understanding but maybe lack of spark
    if (g1 && g1 === g2) return 75;

    // SJ + NT/NF can be friction
    if ((g1 === MBTI_GROUPS.SENTINELS && (g2 === MBTI_GROUPS.ANALYSTS || g2 === MBTI_GROUPS.DIPLOMATS)) ||
        ((g1 === MBTI_GROUPS.ANALYSTS || g1 === MBTI_GROUPS.DIPLOMATS) && g2 === MBTI_GROUPS.SENTINELS)) return 60;

    return 70; // Default decent compatibility
};

// --- 2. ATTACHMENT (Sécurité Émotionnelle) ---
const getAttachmentScore = (a1: AttachmentStyle, a2: AttachmentStyle): number => {
    // Secure + Secure = Heaven
    if (a1 === AttachmentStyle.SECURE && a2 === AttachmentStyle.SECURE) return 100;
    // Secure heals Insecure
    if (a1 === AttachmentStyle.SECURE || a2 === AttachmentStyle.SECURE) return 85; 
    
    // The "Anxious-Avoidant Trap" (High chemistry, high pain) - Algorithm penalty
    const pair = [a1, a2].sort();
    if (pair.includes(AttachmentStyle.ANXIOUS) && pair.includes(AttachmentStyle.AVOIDANT)) return 40; 
    
    // Similar insecurities can understand each other
    if (a1 === a2) return 65;
    
    return 55; 
};

// --- 3. SCORE KARMIQUE (L'Algo Vivant) ---
// Cherche l'équilibre, pas la similarité parfaite.
const getKarmicScore = (a1: DynamicAura, a2: DynamicAura): number => {
    if (!a1 || !a2) return 50;

    // Feu (Intensité) a besoin de Terre (Stabilité) ou d'Air (Ouverture)
    // Deux Feux peuvent brûler trop vite.
    const intensityDiff = Math.abs(a1.intensity - a2.intensity);
    let intensityScore = 100 - (intensityDiff * 0.6); // Similaire mais pas trop pénalisant

    // Eau (Profondeur) cherche Eau. Difficile pour un profond de dater quelqu'un de superficiel.
    const depthDiff = Math.abs(a1.depth - a2.depth);
    const depthScore = 100 - (depthDiff * 1.2); // Très pénalisant si grand écart

    // Terre (Stabilité) stabilise tout le monde.
    const maxStability = Math.max(a1.stability, a2.stability);
    const stabilityScore = maxStability; 

    // Air (Ouverture)
    const opennessAvg = (a1.openness + a2.openness) / 2;
    
    // Formule secrète de Cupidon
    return (intensityScore * 0.20) + (depthScore * 0.40) + (stabilityScore * 0.20) + (opennessAvg * 0.20);
}

// --- 4. LIFESTYLE (Indice de Jaccard) ---
const getLifestyleScore = (i1: string[], i2: string[]): number => {
    if (!i1.length || !i2.length) return 50;
    const intersection = i1.filter(x => i2.includes(x));
    const union = new Set([...i1, ...i2]);
    const ratio = intersection.length / union.size;
    // Boost le score car peu de tags matchent souvent exactement
    return Math.min(ratio * 4 * 100, 100); 
};

// --- CALCUL FINAL ---
export const calculateCompatibility = (user: UserProfile, candidate: UserProfile): { score: number; label: string, details: CompatibilityDetails } => {
  
  const emotionalScore = getAttachmentScore(user.attachment, candidate.attachment);
  const intellectualScore = getMBTIScore(user.mbti, candidate.mbti);
  const lifestyleScore = getLifestyleScore(user.interests, candidate.interests);
  const karmicScore = getKarmicScore(user.aura, candidate.aura);

  // Pondération "Moteur de Compatibilité Holistique"
  // Karmic (Comportement réel) a un poids important (30%)
  const totalScore = Math.round(
      (emotionalScore * 0.25) +     // Cœur
      (intellectualScore * 0.25) +  // Esprit
      (lifestyleScore * 0.20) +     // Passions
      (karmicScore * 0.30)          // Karma (Réalité)
  );

  // Labels Marketing (Grand Public)
  let label = "Mystère";
  if (totalScore >= 94) label = "Union Cosmique";
  else if (totalScore >= 88) label = "Âme Sœur";
  else if (karmicScore > 90) label = "Destin Croisé"; 
  else if (intellectualScore > 90 && emotionalScore < 60) label = "Feu Cérébral";
  else if (emotionalScore > 90) label = "Refuge";
  else if (totalScore >= 75) label = "Harmonie";
  else label = "Exploration";

  return { 
      score: totalScore, 
      label,
      details: {
          emotional: emotionalScore,
          intellectual: intellectualScore,
          lifestyle: lifestyleScore,
          karmic: karmicScore
      }
  };
};

export const QUESTIONS = [
  {
    id: 1, category: 'MBTI' as const, targetAxis: 'EI' as const,
    text: "Après une semaine de travail chargée, comment recharges-tu tes batteries ?",
    options: [{ text: "En sortant avec des amis.", value: "E" }, { text: "Dans le calme, seul(e).", value: "I" }]
  },
  {
    id: 2, category: 'MBTI' as const, targetAxis: 'EI' as const,
    text: "Dans une soirée, tu es plutôt du genre à :",
    options: [{ text: "Parler à tout le monde.", value: "E" }, { text: "Discuter profondément avec peu de gens.", value: "I" }]
  },
  {
    id: 3, category: 'MBTI' as const, targetAxis: 'SN' as const,
    text: "Quand tu penses à un projet, tu te concentres sur :",
    options: [{ text: "Les étapes concrètes.", value: "S" }, { text: "La vision d'ensemble.", value: "N" }]
  },
  {
    id: 4, category: 'MBTI' as const, targetAxis: 'SN' as const,
    text: "Tu fais confiance à :",
    options: [{ text: "Ton expérience passée.", value: "S" }, { text: "Ton instinct.", value: "N" }]
  },
  {
    id: 5, category: 'MBTI' as const, targetAxis: 'TF' as const,
    text: "Un ami demande un conseil difficile :",
    options: [{ text: "Analyser logiquement.", value: "T" }, { text: "Considérer ses émotions.", value: "F" }]
  },
  {
    id: 6, category: 'MBTI' as const, targetAxis: 'TF' as const,
    text: "La vérité est plus importante que :",
    options: [{ text: "Le tact.", value: "T" }, { text: "L'harmonie.", value: "F" }]
  },
  {
    id: 7, category: 'MBTI' as const, targetAxis: 'JP' as const,
    text: "Pour les vacances :",
    options: [{ text: "Tout planifier.", value: "J" }, { text: "Partir à l'aventure.", value: "P" }]
  },
  {
    id: 8, category: 'MBTI' as const, targetAxis: 'JP' as const,
    text: "Face à une deadline :",
    options: [{ text: "Commencer en avance.", value: "J" }, { text: "Attendre la pression.", value: "P" }]
  },
  {
    id: 9, category: 'ATTACHMENT' as const,
    text: "En début de relation, ta préoccupation :",
    options: [
      { text: "Est-ce qu'on m'aime vraiment ?", value: AttachmentStyle.ANXIOUS },
      { text: "Vais-je perdre ma liberté ?", value: AttachmentStyle.AVOIDANT },
      { text: "C'est une belle aventure.", value: AttachmentStyle.SECURE },
      { text: "Je veux fuir et rester à la fois.", value: AttachmentStyle.DISORGANIZED }
    ]
  },
  {
    id: 10, category: 'ATTACHMENT' as const,
    text: "Pas de réponse depuis 4h :",
    options: [
      { text: "Je m'inquiète, j'ai fait quelque chose ?", value: AttachmentStyle.ANXIOUS },
      { text: "Tant mieux, j'ai de l'espace.", value: AttachmentStyle.AVOIDANT },
      { text: "Il/Elle est sûrement occupé(e).", value: AttachmentStyle.SECURE },
      { text: "Je bloque puis je débloque.", value: AttachmentStyle.DISORGANIZED }
    ]
  },
  {
    id: 11, category: 'ATTACHMENT' as const,
    text: "L'intimité émotionnelle :",
    options: [
      { text: "J'en ai besoin vitalement.", value: AttachmentStyle.ANXIOUS },
      { text: "Ça me met mal à l'aise.", value: AttachmentStyle.AVOIDANT },
      { text: "C'est naturel et agréable.", value: AttachmentStyle.SECURE },
      { text: "C'est dangereux.", value: AttachmentStyle.DISORGANIZED }
    ]
  },
  {
    id: 12, category: 'ATTACHMENT' as const,
    text: "En cas de conflit :",
    options: [
      { text: "J'insiste jusqu'à résolution.", value: AttachmentStyle.ANXIOUS },
      { text: "Je me ferme ou je pars.", value: AttachmentStyle.AVOIDANT },
      { text: "J'écoute et j'exprime mon ressenti.", value: AttachmentStyle.SECURE },
      { text: "J'explose.", value: AttachmentStyle.DISORGANIZED }
    ]
  }
];
