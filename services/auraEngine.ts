
import { UserProfile, DynamicAura } from '../types';

/**
 * AURA ENGINE - "Cupid's Hidden Brain"
 * 
 * Ce service est un organisme vivant. Il écoute, observe et apprend.
 * Il transforme des actions banales (swipe, temps de lecture) en données psychologiques.
 */

const DEFAULT_AURA: DynamicAura = {
    intensity: 50,
    depth: 50,
    stability: 50,
    openness: 50,
    dominantElement: 'TERRE'
};

/**
 * Initialisation basée sur les données déclaratives (Statique)
 */
export const initializeAura = (bio: string, mbti: string): DynamicAura => {
    const bioLen = bio.length;
    const isExtravert = mbti.startsWith('E');
    const isIntuitive = mbti.includes('N');
    
    return {
        intensity: isExtravert ? 65 : 35,
        depth: Math.min(bioLen / 3, 80) + (isIntuitive ? 10 : 0),
        stability: 50, // Départ neutre
        openness: isIntuitive ? 70 : 40,
        lastActionTimestamp: Date.now(),
        dominantElement: isExtravert ? 'FEU' : 'EAU'
    };
};

/**
 * Recalibrage de l'Aura après un Swipe (Dynamique)
 * Analyse l'impulsivité et la sélectivité.
 */
export const updateAuraFromSwipe = (
    currentAura: DynamicAura = DEFAULT_AURA,
    direction: 'left' | 'right' | 'super',
    targetProfile: UserProfile,
    timeTakenMs: number
): DynamicAura => {
    const newAura = { ...currentAura };

    // 1. INTENSITÉ (Vitesse de décision -> Feu)
    if (timeTakenMs < 1000) {
        newAura.intensity = Math.min(newAura.intensity + 1.5, 100); // Impulsif
    } else if (timeTakenMs > 4000) {
        newAura.intensity = Math.max(newAura.intensity - 0.5, 0); // Réfléchi
    }

    // 2. PROFONDEUR (Intérêt pour le contenu -> Eau)
    // Si l'utilisateur like quelqu'un avec une longue bio, il valorise la profondeur.
    if (direction === 'right' || direction === 'super') {
        if (targetProfile.bio.length > 150) {
            newAura.depth = Math.min(newAura.depth + 1, 100);
        }
    }

    // 3. OUVERTURE (Curiosité -> Air)
    // Le Super Like est un signe d'ouverture et d'intensité émotionnelle
    if (direction === 'super') {
        newAura.intensity = Math.min(newAura.intensity + 4, 100);
        newAura.openness = Math.min(newAura.openness + 2, 100);
    }
    // Trop de swipes gauche baisse l'ouverture
    if (direction === 'left') {
        newAura.openness = Math.max(newAura.openness - 0.2, 0);
    } else {
        newAura.openness = Math.min(newAura.openness + 0.3, 100);
    }

    newAura.lastActionTimestamp = Date.now();
    newAura.dominantElement = calculateDominantElement(newAura);
    return newAura;
};

/**
 * Recalibrage de l'Aura après un Message (Dynamique)
 * Analyse la qualité de la communication.
 */
export const updateAuraFromMessage = (
    currentAura: DynamicAura = DEFAULT_AURA,
    messageText: string,
    timeSinceLastMessageMs?: number
): DynamicAura => {
    const newAura = { ...currentAura };
    const length = messageText.length;
    const hasEmoji = /[\p{Extended_Pictographic}]/u.test(messageText);

    // 1. PROFONDEUR
    if (length > 80) {
        newAura.depth = Math.min(newAura.depth + 2, 100); // Longs textes
    } else if (length < 10 && !hasEmoji) {
        newAura.depth = Math.max(newAura.depth - 0.5, 0); // "Ok", "Salut"
    }

    // 2. INTENSITÉ
    if (timeSinceLastMessageMs && timeSinceLastMessageMs < 60000) { 
        newAura.intensity = Math.min(newAura.intensity + 1, 100); // Tac au tac
    }
    if (hasEmoji) {
        newAura.intensity = Math.min(newAura.intensity + 0.5, 100); // Expressif
    }

    // 3. STABILITÉ (Terre)
    // Le fait d'engager la conversation augmente la stabilité (engagement)
    newAura.stability = Math.min(newAura.stability + 1, 100);

    newAura.lastActionTimestamp = Date.now();
    newAura.dominantElement = calculateDominantElement(newAura);
    return newAura;
};

/**
 * Calcule l'élément dominant pour l'UI
 */
const calculateDominantElement = (aura: DynamicAura): 'FEU' | 'EAU' | 'TERRE' | 'AIR' => {
    const scores = [
        { type: 'FEU', val: aura.intensity },
        { type: 'EAU', val: aura.depth },
        { type: 'TERRE', val: aura.stability },
        { type: 'AIR', val: aura.openness }
    ];
    scores.sort((a, b) => b.val - a.val);
    return scores[0].type as any;
}

export const getElementColor = (element: string): string => {
    switch (element) {
        case 'FEU': return '#ef4444'; // Rouge Passion
        case 'EAU': return '#3b82f6'; // Bleu Profond
        case 'TERRE': return '#10b981'; // Vert Nature
        case 'AIR': return '#f59e0b'; // Or Lumineux
        default: return '#b06ab3'; // Aura Violette
    }
}
