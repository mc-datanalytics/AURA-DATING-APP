
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
// Local Blocklist Cache (to update UI instantly)
let blockedUserIds: string[] = [];

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
    blockedUserIds = [];
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

export const uploadVoiceAura = async (blob: Blob): Promise<string | null> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user ? user.id : getCurrentUserId();
        if (!userId) throw new Error("User not logged in");

        const fileName = `${userId}/voice_aura_${Date.now()}.webm`;
        
        // We reuse 'avatars' bucket for simplicity in this demo, or a specific 'audio' bucket if available
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, blob, {
            contentType: 'audio/webm'
        });
        
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
        return data.publicUrl;
    } catch (error) {
        console.error("Voice Aura Upload Error:", error);
        return null;
    }
}

// --- PROFILE ---
export const getMyProfile = async (): Promise<UserProfile | null> => {
  const id = getCurrentUserId();
  if (!id) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  if (error || !data) return null;
  
  // Load blocks
  await loadBlockedUsers(id);

  return mapDbProfileToApp(data);
};

const loadBlockedUsers = async (myId: string) => {
    const { data } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', myId);
    if (data) {
        blockedUserIds = data.map((b: any) => b.blocked_id);
    }
}

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
        aura: initialAura // CRITIQUE: Sauvegarde l'aura initiale pour l'algo SQL
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
          voice_aura_url: profile.voiceAuraUrl, // Save Voice URL
          daily_aura_answer: profile.dailyAuraAnswer,
          is_boosted: profile.isBoosted,
          is_premium: profile.isPremium,
          discovery_settings: profile.discoverySettings,
          aura: profile.aura // CRITIQUE: Met à jour l'aura vivante dans la DB
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

// --- MODERATION & SECURITY ---

export const reportUser = async (reporterId: string, reportedId: string, reason: string, details: string) => {
    const { error } = await supabase.from('reports').insert([{
        reporter_id: reporterId,
        reported_id: reportedId,
        reason,
        details
    }]);
    if (error) console.error("Report error:", error);
    return !error;
};

export const blockUser = async (blockerId: string, blockedId: string) => {
    const { error } = await supabase.from('blocks').insert([{
        blocker_id: blockerId,
        blocked_id: blockedId
    }]);
    
    if (!error) {
        blockedUserIds.push(blockedId);
        // Invalidate discovery cache to remove blocked user immediately
        discoveryCache = null;
    } else {
        console.error("Block error:", error);
    }
    return !error;
};


// --- CORE: DISCOVERY & MATCHING ---

// Helper: Fetch a single profile by ID (Defined before usage)
const getProfileById = async (id: string): Promise<UserProfile | null> => {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
    return data ? mapDbProfileToApp(data) : null;
}

export const getDiscoveryProfiles = async (myProfile: UserProfile): Promise<UserProfile[]> => {
  if (!myProfile) return [];
  resetProfileViewTimer();

  // 1. Check Memory Cache
  if (discoveryCache && 
      discoveryCache.uid === myProfile.id && 
      (Date.now() - discoveryCache.timestamp < CACHE_TTL_MS) &&
      discoveryCache.data.length > 0) {
      // Filter blocked users from cache
      return discoveryCache.data.filter(p => !blockedUserIds.includes(p.id));
  }

  let rawProfiles: any[] = [];
  let usedRpc = false;

  // 2. Try Server-Side Matching (RPC) for Scalability
  try {
      const { data, error } = await supabase.rpc('get_compatible_profiles', { query_user_id: myProfile.id });
      
      if (!error && data) {
          console.log("✅ Using Optimized SQL Matching Engine (Karmic V2)");
          rawProfiles = data;
          usedRpc = true;
      } else {
          // RPC might fail if blocks table exists but function wasn't updated, handle gracefully
          if (error) console.warn("RPC Error (Falling back to legacy):", error.message);
          throw new Error("RPC Failed");
      }
  } catch (err) {
      // 3. FALLBACK: Legacy Client-Side Matching
      console.log("⚠️ Using Legacy Client-Side Matching");
      
      const { data: swipedData } = await supabase.from('swipes').select('target_id').eq('swiper_id', myProfile.id);
      const swipedIds = swipedData?.map((s: any) => s.target_id) || [];
      
      // Add blocked IDs to exclusion
      const excludedIds = [...swipedIds, ...blockedUserIds];

      let query = supabase.from('profiles').select('*').neq('id', myProfile.id);

      if (myProfile.discoverySettings) {
          const { minAge, maxAge } = myProfile.discoverySettings;
          query = query.gte('age', minAge).lte('age', maxAge);
      }

      if (excludedIds.length > 0 && excludedIds.length < 1000) {
         query = query.not('id', 'in', `(${excludedIds.join(',')})`);
      }
        
      const { data: candidates } = await query.limit(50);
      if (candidates) {
          rawProfiles = candidates.filter(c => !excludedIds.includes(c.id));
      }
  }

  // 4. Map to App Format
  const profiles = rawProfiles.map(mapDbProfileToApp);
  
  // 5. APPLICATION DU CUPID'S BRAIN (Client-Side refinement)
  const processed = profiles.map(p => {
      const { score, label, details } = calculateCompatibility(myProfile, p);
      return { ...p, compatibilityScore: score, compatibilityLabel: label, compatibilityDetails: details };
  });

  if (!usedRpc) {
      processed.sort((a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0));
  }

  // 6. Set Cache
  if (processed.length > 0) {
      discoveryCache = {
          uid: myProfile.id,
          timestamp: Date.now(),
          data: processed
      };
  }

  return processed;
};

export const restoreLastSwipe = async (myProfile: UserProfile): Promise<UserProfile | null> => {
    const { data } = await supabase.from('swipes')
        .select('id, target_id')
        .eq('swiper_id', myProfile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    
    if(data) {
        // Delete the swipe
        await supabase.from('swipes').delete().eq('id', data.id);
        
        // Invalidate discovery cache
        discoveryCache = null;

        // Fetch the profile details
        const targetProfile = await getProfileById(data.target_id);
        if (targetProfile) {
            // Recalculate match score
            const { score, label, details } = calculateCompatibility(myProfile, targetProfile);
            return { 
                ...targetProfile, 
                compatibilityScore: score, 
                compatibilityLabel: label, 
                compatibilityDetails: details 
            };
        }
    }
    return null;
};

export const swipeProfile = async (myId: string, targetId: string, direction: 'left' | 'right' | 'super') => {
    
    // --- HOOK AURA ENGINE ---
    const myProfile = await getMyProfile();
    const targetProfile = await getProfileById(targetId);

    if (myProfile && targetProfile) {
        const timeTaken = Date.now() - profileViewStartTime;
        const newAura = AuraEngine.updateAuraFromSwipe(myProfile.aura, direction, targetProfile, timeTaken);
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

export const undoLastSwipe = async (myId: string): Promise<string | null> => {
    // DEPRECATED: Use restoreLastSwipe instead for full profile recovery
    // This function is kept only if legacy calls exist, but we are moving to the new one.
    const { data } = await supabase.from('swipes').select('id, target_id').eq('swiper_id', myId).order('created_at', { ascending: false }).limit(1).single();
    if(data) {
        await supabase.from('swipes').delete().eq('id', data.id);
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
    
    // Filter out blocked users and already swiped users
    const { data: mySwipes } = await supabase.from('swipes').select('target_id').eq('swiper_id', myProfile.id).in('target_id', swiperIds);
    const doneIds = mySwipes?.map((s: any) => s.target_id) || [];
    const pendingIds = swiperIds.filter((id: string) => !doneIds.includes(id) && !blockedUserIds.includes(id));

    if (pendingIds.length === 0) return [];

    const { data: profiles } = await supabase.from('profiles').select('*').in('id', pendingIds);
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
        
        // Skip blocked users
        if (blockedUserIds.includes(otherUserDb.id)) continue;

        const otherUser = mapDbProfileToApp(otherUserDb);
        
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
        voiceAuraUrl: dbProfile.voice_aura_url, // Map the new field
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
