import { supabase } from './supabaseClient';
import { UserProfile, ChatSession, Message, AttachmentStyle, NotificationSettings, DiscoverySettings } from '../types';
import { calculateCompatibility } from './matchingService';
import * as AuraEngine from './auraEngine';

/**
 * Data Service
 * Le système nerveux central de l'application.
 * Connecte Supabase, le Matching Engine et l'Aura Engine.
 */

const STORAGE_KEY_USER_ID = 'aura_user_id';
let profileViewStartTime = Date.now();

// Simple Memory Cache for Discovery
// Avoids hitting Supabase every time we switch views
let discoveryCache: { uid: string, timestamp: number, data: UserProfile[] } | null = null;
const CACHE_TTL_MS = 60000; // 1 minute cache

export const resetProfileViewTimer = () => {
    profileViewStartTime = Date.now();
};

// --- AUTH & STORAGE ---
export const signUp = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password: pass });
    if (error) throw error;
    return data;
}

export const signIn = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    return data;
}

export const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(STORAGE_KEY_USER_ID);
    discoveryCache = null; // Clear cache on logout
}

export const getCurrentUserId = (): string | null => localStorage.getItem(STORAGE_KEY_USER_ID);
export const setCurrentUserId = (id: string) => localStorage.setItem(STORAGE_KEY_USER_ID, id);

export const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user ? user.id : getCurrentUserId();
        if (!userId) throw new Error("User not logged in");

        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
        return data.publicUrl;
    } catch (error) {
        console.error(error);
        return null;
    }
}

// --- PROFILE ---
export const getMyProfile = async (): Promise<UserProfile | null> => {
  const id = getCurrentUserId();
  if (!id) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  if (error || !data) return null;
  return mapDbProfileToApp(data);
};

export const createMyProfile = async (profileData: Partial<UserProfile>): Promise<UserProfile | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  const id = user ? user.id : getCurrentUserId(); 
  if (!id) return null;

  // Initialisation de l'Aura (Zero-Start)
  const initialAura = AuraEngine.initializeAura(profileData.bio || '', profileData.mbti || 'ISTJ');

  const payload = { 
        id: id, 
        name: profileData.name,
        age: profileData.age,
        bio: profileData.bio,
        mbti: profileData.mbti,
        attachment: profileData.attachment,
        image_url: profileData.imageUrl,
        photos: profileData.photos,
        interests: profileData.interests,
        // En prod, on sauverait l'aura ici
  };

  const { data, error } = await supabase.from('profiles').upsert([payload]).select().single();
  if (error) throw error;

  if (data) {
      setCurrentUserId(data.id);
      const mapped = mapDbProfileToApp(data);
      mapped.aura = initialAura; // Force local aura init
      return mapped;
  }
  return null;
};

export const updateMyProfile = async (profile: UserProfile): Promise<UserProfile | null> => {
    const payload = {
          bio: profile.bio,
          interests: profile.interests,
          image_url: profile.imageUrl,
          photos: profile.photos,
          daily_aura_answer: profile.dailyAuraAnswer,
          is_boosted: profile.isBoosted,
          is_premium: profile.isPremium,
          // aura: profile.aura
    };

    const { data } = await supabase.from('profiles').update(payload).eq('id', profile.id).select().single();
    
    // Invalidate cache if we change settings
    if (discoveryCache) discoveryCache = null;

    return data ? mapDbProfileToApp(data) : profile;
}

export const upgradeToPremium = async (userId: string): Promise<boolean> => {
    const { error } = await supabase.from('profiles').update({ is_premium: true }).eq('id', userId);
    if (error) {
        console.error("Premium upgrade failed", error);
        return false;
    }
    return true;
};

// --- CORE: DISCOVERY & MATCHING ---
export const getDiscoveryProfiles = async (myProfile: UserProfile): Promise<UserProfile[]> => {
  if (!myProfile) return [];
  resetProfileViewTimer();

  // 1. Check Memory Cache
  if (discoveryCache && 
      discoveryCache.uid === myProfile.id && 
      (Date.now() - discoveryCache.timestamp < CACHE_TTL_MS) &&
      discoveryCache.data.length > 0) {
      console.log("Serving Discovery from Memory Cache");
      return discoveryCache.data;
  }

  const { data: swipedData } = await supabase.from('swipes').select('target_id').eq('swiper_id', myProfile.id);
  const swipedIds = swipedData?.map((s: any) => s.target_id) || [];
  
  let query = supabase.from('profiles').select('*').neq('id', myProfile.id);

  if (myProfile.discoverySettings) {
      const { minAge, maxAge } = myProfile.discoverySettings;
      query = query.gte('age', minAge).lte('age', maxAge);
  }

  if (swipedIds.length > 0 && swipedIds.length < 1000) {
     query = query.not('id', 'in', `(${swipedIds.join(',')})`);
  }
    
  const { data: candidates } = await query.limit(20);
  if (!candidates) return [];

  const filtered = swipedIds.length >= 1000 ? candidates.filter(c => !swipedIds.includes(c.id)) : candidates;
  const profiles = filtered.map(mapDbProfileToApp);
  
  // APPLICATION DU CUPID'S BRAIN
  // On calcule la compatibilité avancée ici
  const processed = profiles.map(p => {
      const { score, label, details } = calculateCompatibility(myProfile, p);
      return { ...p, compatibilityScore: score, compatibilityLabel: label, compatibilityDetails: details };
  }).sort((a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0));

  // 2. Set Cache
  discoveryCache = {
      uid: myProfile.id,
      timestamp: Date.now(),
      data: processed
  };

  return processed;
};

export const swipeProfile = async (myId: string, targetId: string, direction: 'left' | 'right' | 'super') => {
    
    // --- HOOK AURA ENGINE ---
    // L'utilisateur agit, donc son aura évolue.
    const myProfile = await getMyProfile();
    const targetProfile = await getProfileById(targetId);

    if (myProfile && targetProfile) {
        const timeTaken = Date.now() - profileViewStartTime;
        const newAura = AuraEngine.updateAuraFromSwipe(myProfile.aura, direction, targetProfile, timeTaken);
        // Mise à jour optimiste locale (et silencieuse DB)
        await updateMyProfile({ ...myProfile, aura: newAura });
    }
    resetProfileViewTimer();
    // -------------------------

    await supabase.from('swipes').insert([{ swiper_id: myId, target_id: targetId, direction }]);
    
    // Remove from cache if exists
    if (discoveryCache) {
        discoveryCache.data = discoveryCache.data.filter(p => p.id !== targetId);
    }

    if (direction === 'left') return null;

    const { data: reciprocal } = await supabase
        .from('swipes')
        .select('*')
        .eq('swiper_id', targetId)
        .eq('target_id', myId)
        .in('direction', ['right', 'super'])
        .single();

    if (reciprocal) {
        const { data: match } = await supabase.from('matches').insert([{ user_a: myId, user_b: targetId }]).select().single();
        return match;
    }
    return null;
};

const getProfileById = async (id: string): Promise<UserProfile | null> => {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
    return data ? mapDbProfileToApp(data) : null;
}

export const undoLastSwipe = async (myId: string): Promise<string | null> => {
    const { data } = await supabase.from('swipes').select('id, target_id').eq('swiper_id', myId).order('created_at', { ascending: false }).limit(1).single();
    if(data) {
        await supabase.from('swipes').delete().eq('id', data.id);
        // Invalidate cache to force refetch (simplest way to bring back user)
        discoveryCache = null;
        return data.target_id;
    }
    return null;
};

export const getPendingLikes = async (myProfile: UserProfile): Promise<UserProfile[]> => {
    if (!myProfile) return [];
    const { data: incoming } = await supabase.from('swipes').select('swiper_id, direction').eq('target_id', myProfile.id).in('direction', ['right', 'super']);
    if (!incoming || incoming.length === 0) return [];
    
    const swiperIds = incoming.map((s: any) => s.swiper_id);
    const { data: mySwipes } = await supabase.from('swipes').select('target_id').eq('swiper_id', myProfile.id).in('target_id', swiperIds);
    const doneIds = mySwipes?.map((s: any) => s.target_id) || [];
    const pending = swiperIds.filter((id: string) => !doneIds.includes(id));

    if (pending.length === 0) return [];

    const { data: profiles } = await supabase.from('profiles').select('*').in('id', pending);
    if (!profiles) return [];

    return profiles.map((p: any) => {
        const appProfile = mapDbProfileToApp(p);
        const { score, label, details } = calculateCompatibility(myProfile, appProfile);
        const isSuper = incoming.find((s: any) => s.swiper_id === p.id && s.direction === 'super');
        return { ...appProfile, compatibilityScore: score, compatibilityLabel: label, compatibilityDetails: details, hasSuperLikedUser: !!isSuper };
    });
};

// --- CHAT ---

export const getMatches = async (myId: string): Promise<ChatSession[]> => {
    const { data: matches } = await supabase.from('matches').select(`id, is_revealed, user_a ( * ), user_b ( * )`).or(`user_a.eq.${myId},user_b.eq.${myId}`);
    if (!matches) return [];

    const sessions: ChatSession[] = [];
    for (const m of matches) {
        const userA = Array.isArray(m.user_a) ? m.user_a[0] : m.user_a;
        const userB = Array.isArray(m.user_b) ? m.user_b[0] : m.user_b;
        const otherUserDb = userA.id === myId ? userB : userA;
        const otherUser = mapDbProfileToApp(otherUserDb);
        
        // Recalcul du score dynamique à chaque chargement
        const myUserDb = userA.id === myId ? userA : userB;
        const myUser = mapDbProfileToApp(myUserDb);
        const { score } = calculateCompatibility(myUser, otherUser);
        otherUser.compatibilityScore = score;

        const { data: msgs } = await supabase.from('messages').select('*').eq('match_id', m.id).order('created_at', { ascending: false }).limit(1);

        sessions.push({
            matchId: m.id,
            user: otherUser,
            isRevealed: m.is_revealed,
            messages: msgs && msgs.length > 0 ? [mapDbMessageToApp(msgs[0])] : []
        });
    }
    return sessions;
};

export const sendMessage = async (matchId: string, senderId: string, text: string): Promise<Message | null> => {
    
    // --- HOOK AURA ENGINE ---
    const myProfile = await getMyProfile();
    if (myProfile) {
        const newAura = AuraEngine.updateAuraFromMessage(myProfile.aura, text);
        await updateMyProfile({ ...myProfile, aura: newAura });
    }
    // -------------------------

    const { data, error } = await supabase.from('messages').insert([{ match_id: matchId, sender_id: senderId, text }]).select().single();
    return data ? mapDbMessageToApp(data) : null;
};

export const subscribeToChat = (matchId: string, callback: (msg: Message) => void) => {
    return supabase.channel(`chat:${matchId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` }, 
            (payload) => callback(mapDbMessageToApp(payload.new))
        ).subscribe();
}

const mapDbProfileToApp = (dbProfile: any): UserProfile => {
    // Mappage de l'Aura stockée (ou génération d'une par défaut)
    let aura = dbProfile.aura;
    if (!aura || !aura.dominantElement) {
        aura = AuraEngine.initializeAura(dbProfile.bio || '', dbProfile.mbti || 'ISTJ');
    }

    return {
        id: dbProfile.id,
        name: dbProfile.name,
        age: dbProfile.age,
        gender: dbProfile.gender, 
        bio: dbProfile.bio || '',
        mbti: dbProfile.mbti || 'ISTJ',
        attachment: dbProfile.attachment as AttachmentStyle,
        imageUrl: dbProfile.image_url,
        photos: dbProfile.photos || [dbProfile.image_url],
        interests: dbProfile.interests || [],
        isPremium: dbProfile.is_premium,
        dailyAuraAnswer: dbProfile.daily_aura_answer,
        isBoosted: dbProfile.is_boosted,
        aura: aura,
        notificationSettings: dbProfile.notification_settings,
        discoverySettings: dbProfile.discovery_settings
    };
};

const mapDbMessageToApp = (dbMsg: any): Message => ({
    id: dbMsg.id,
    senderId: dbMsg.sender_id === 'system' ? 'system' : dbMsg.sender_id, 
    text: dbMsg.text,
    timestamp: new Date(dbMsg.created_at)
});