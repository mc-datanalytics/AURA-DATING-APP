
export enum AttachmentStyle {
  SECURE = 'Sécure',
  ANXIOUS = 'Anxieux',
  AVOIDANT = 'Évitant',
  DISORGANIZED = 'Désorganisé'
}

export interface NotificationSettings {
  matches: boolean;
  messages: boolean;
  likes: boolean;
  dailyAura: boolean;
  superLikes: boolean;
}

export interface DiscoverySettings {
  minAge: number;
  maxAge: number;
  distance: number;
  genderPreference: 'Homme' | 'Femme' | 'ALL';
}

export interface CompatibilityDetails {
  emotional: number;   // Attachment based (Cœur)
  intellectual: number; // MBTI based (Esprit)
  lifestyle: number;    // Interests based (Passions)
  karmic: number;       // Dynamic Aura Balance (Karma)
}

// Le "Monstre" Psychologique (Invisible pour l'user, utilisé par l'algo)
export interface DynamicAura {
  intensity: number;   // 0-100 (Vitesse, Impulsivité) - FEU
  depth: number;       // 0-100 (Longueur messages, complexité) - EAU
  stability: number;   // 0-100 (Régularité, Ancienneté) - TERRE
  openness: number;    // 0-100 (Variété des likes, Curiosité) - AIR
  
  lastActionTimestamp?: number;
  dominantElement?: 'FEU' | 'EAU' | 'TERRE' | 'AIR';
}

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender?: 'Homme' | 'Femme' | 'Autre';
  bio: string;
  mbti: string;
  attachment: AttachmentStyle;
  imageUrl: string;
  photos?: string[]; 
  interests: string[];
  voiceAuraUrl?: string; // URL to the audio bio
  
  // L'Aura Vivante
  aura: DynamicAura;

  // Données de Match
  compatibilityScore?: number; // 0-100
  compatibilityLabel?: string; 
  compatibilityDetails?: CompatibilityDetails; 
  
  hasSuperLikedUser?: boolean;
  dailyAuraAnswer?: string; 
  isBoosted?: boolean; 
  isPremium?: boolean;
  notificationSettings?: NotificationSettings;
  discoverySettings?: DiscoverySettings;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
}

export interface ChatSession {
  matchId: string;
  user: UserProfile;
  messages: Message[];
  isRevealed: boolean; 
}

export enum AppView {
  AUTH = 'AUTH',
  ONBOARDING = 'ONBOARDING',
  DISCOVERY = 'DISCOVERY',
  MATCHES = 'MATCHES', 
  CHAT = 'CHAT',       
  SETTINGS = 'SETTINGS', 
  EDIT_PROFILE = 'EDIT_PROFILE', 
  MY_PROFILE_PREVIEW = 'MY_PROFILE_PREVIEW', 
  LIKES_RECEIVED = 'LIKES_RECEIVED' 
}

export enum DiscoveryMode {
  CLAIRVOYANCE = 'CLAIRVOYANCE',
  INCOGNITO = 'INCOGNITO'
}

export interface Question {
  id: number;
  text: string;
  category: 'MBTI' | 'ATTACHMENT';
  targetAxis?: 'EI' | 'SN' | 'TF' | 'JP'; 
  options: {
    text: string;
    value: string; 
  }[];
}