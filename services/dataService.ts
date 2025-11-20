
import { supabase } from './supabaseClient';
import { UserProfile, ChatSession, Message, AttachmentStyle, NotificationSettings, DiscoverySettings, SubscriptionTier, UserLocation } from '../types';
import { calculateCompatibility } from './matchingService';
import * as AuraEngine from './auraEngine';
import { compressImage } from './imageOptimizer'; // Import du nouveau service

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

// --- HELPER: DISTANCE CALCULATION (Haversine Formula) ---
const calculateDistanceKm = (loc1?: UserLocation, loc2?: UserLocation): number => {
    if (!loc1 || !loc2 || !loc1.latitude || !loc2.latitude) return 0;
    
    const R = 6371; // Rayon de la Terre en km
    const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
    const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
    
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

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

        // 1. OPTIMISATION DE L'IMAGE (Client-Side)
        // On convertit tout en WebP pour la performance
        const compressedBlob = await compressImage(file);
        
        // On force l'extension .webp
        const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;

        // 2. UPLOAD VERS SUPABASE
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, compressedBlob, {
            contentType: 'image/webp',
            upsert: false
        });

        if (uploadError) throw uploadError;

        // 3. RÉCUPÉRATION DE L'URL PUBLIQUE
        const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
        return data.publicUrl;
    } catch (error) {
        console.error("Erreur upload photo:", error);
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

export const uploadChatMedia = async (file: File | Blob, type: 'image' | 'audio'): Promise<string | null> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user ? user.id : getCurrentUserId();
        if (!userId) throw new Error("User not logged in");

        const ext = type === 'image' ? 'webp' : 'webm';
        const contentType = type === 'image' ? 'image/webp' : 'audio/webm';
        const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

        // Compress if image
        let fileToUpload = file;
        if (type === 'image' && file instanceof File) {
            fileToUpload = await compressImage(file);
        }

        const { error: uploadError } = await supabase.storage.from('chat-media').upload(fileName, fileToUpload, {
            contentType: contentType,
            upsert: false
        });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('chat-media').getPublicUrl(fileName);
        return data.publicUrl;
    } catch (error) {
        console.error("Chat Media Upload Error:", error);
        return null;
    }
}

// --- PROFILE & LOCATION ---
export const updateUserLocation = async (): Promise<UserLocation | null> => {
    const userId = getCurrentUserId();
    if (!userId || !('geolocation' in navigator)) return null;

    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                // Update DB
                await supabase.from('profiles').update({ latitude, longitude }).eq('id', userId);
                console.log("📍 Location updated:", latitude, longitude);
                resolve({ latitude, longitude });
            },
            (error) => {
                console.warn("Geolocation denied or error:", error);
                resolve(null);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 } // High accuracy
        );
    });
};

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
        aura: initialAura,
        is_verified: profileData.isVerified // Save verification status
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
          voice_aura_url: profile.voiceAuraUrl, 
          daily_aura_answer: profile.dailyAuraAnswer,
          is_boosted: profile.isBoosted,
          is_premium: profile.isPremium,
          subscription_tier: profile.subscriptionTier, 
          discovery_settings: profile.discoverySettings,
          aura: profile.aura,
          latitude: profile.location?.latitude,
          longitude: profile.location?.longitude
    };

    const { data } = await supabase.from('profiles').update(payload).eq('id', profile.id).select().single();
    
    // Invalidate cache if we change settings
    if (discoveryCache) discoveryCache = null;

    return data ? mapDbProfileToApp(data) : profile;
}

export const upgradeToPremium = async (userId: string, tier: SubscriptionTier, durationDays: number = 30): Promise<boolean> => {
    // Utilisation de la RPC PostgreSQL pour gérer les quotas (Rapports, SuperLikes, etc.)
    const { error } = await supabase.rpc('upgrade_user_subscription', {
        p_user_id: userId,
        p_tier: tier,
        p_duration_days: durationDays
    });

    if (error) {
        console.error("Premium upgrade RPC failed", error);
        const { error: fallbackError } = await supabase.from('profiles').update({ 
            is_premium: true,
            subscription_tier: tier 
        }).eq('id', userId);
        return !fallbackError;
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
          if (error) console.warn("RPC Error (Falling back to legacy):", error.message);
          throw new Error("RPC Failed");
      }
  } catch (err) {
      // 3. FALLBACK: Legacy Client-Side Matching
      console.log("⚠️ Using Legacy Client-Side Matching");
      
      const { data: swipedData } = await supabase.from('swipes').select('target_id').eq('swiper_id', myProfile.id);
      const swipedIds = swipedData?.map((s: any) => s.target_id) || [];
      
      const excludedIds = [...swipedIds, ...blockedUserIds];

      let query = supabase.from('profiles').select('*').neq('id', myProfile.id);

      if (myProfile.discoverySettings) {
          const { minAge, maxAge, genderPreference } = myProfile.discoverySettings;
          query = query.gte('age', minAge).lte('age', maxAge);
          if (genderPreference && genderPreference !== 'ALL') {
               query = query.eq('gender', genderPreference);
          }
      }

      if (excludedIds.length > 0 && excludedIds.length < 1000) {
         query = query.not('id', 'in', `(${excludedIds.join(',')})`);
      }
        
      const { data: candidates } = await query.limit(50);
      if (candidates) {
          rawProfiles = candidates.filter(c => !excludedIds.includes(c.id));
      }
  }

  // 4. Map to App Format & Calculate Distance
  let profiles = rawProfiles.map(mapDbProfileToApp);
  
  // 5. CLIENT-SIDE GEOLOCATION FILTERING & AURA SCORING
  const maxDist = myProfile.discoverySettings?.distance || 100;

  profiles = profiles.map(p => {
      // Calculate real distance
      const dist = calculateDistanceKm(myProfile.location, p.location);
      return { ...p, distanceKm: dist };
  }).filter(p => {
      // Filter by distance (if coordinates exist)
      if (myProfile.location && p.location) {
          return (p.distanceKm || 0) <= maxDist;
      }
      return true; // If location missing, keep for now (or filter out strictly)
  }).map(p => {
      // Aura Scoring
      const { score, label, details } = calculateCompatibility(myProfile, p);
      return { ...p, compatibilityScore: score, compatibilityLabel: label, compatibilityDetails: details };
  });

  if (!usedRpc) {
      profiles.sort((a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0));
  }

  // 6. Set Cache
  if (profiles.length > 0) {
      discoveryCache = {
          uid: myProfile.id,
          timestamp: Date.now(),
          data: profiles
      };
  }

  return profiles;
};

export const restoreLastSwipe = async (myProfile: UserProfile): Promise<UserProfile | null> => {
    const { data } = await supabase.from('swipes')
        .select('id, target_id')
        .eq('swiper_id', myProfile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    
    if(data) {
        await supabase.from('swipes').delete().eq('id', data.id);
        discoveryCache = null;
        const targetProfile = await getProfileById(data.target_id);
        if (targetProfile) {
            const { score, label, details } = calculateCompatibility(myProfile, targetProfile);
            // Recalculate distance on restore
            const dist = calculateDistanceKm(myProfile.location, targetProfile.location);
            return { 
                ...targetProfile, 
                distanceKm: dist,
                compatibilityScore: score, 
                compatibilityLabel: label, 
                compatibilityDetails: details 
            };
        }
    }
    return null;
};

export const swipeProfile = async (myId: string, targetId: string, direction: 'left' | 'right' | 'super') => {
    const myProfile = await getMyProfile();
    const targetProfile = await getProfileById(targetId);

    if (myProfile && targetProfile) {
        const timeTaken = Date.now() - profileViewStartTime;
        const newAura = AuraEngine.updateAuraFromSwipe(myProfile.aura, direction, targetProfile, timeTaken);
        await updateMyProfile({ ...myProfile, aura: newAura });
    }
    resetProfileViewTimer();

    await supabase.from('swipes').insert([{ swiper_id: myId, target_id: targetId, direction }]);
    
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
    
    const { data: mySwipes } = await supabase.from('swipes').select('target_id').eq('swiper_id', myProfile.id).in('target_id', swiperIds);
    const doneIds = mySwipes?.map((s: any) => s.target_id) || [];
    const pendingIds = swiperIds.filter((id: string) => !doneIds.includes(id) && !blockedUserIds.includes(id));

    if (pendingIds.length === 0) return [];

    const { data: profiles } = await supabase.from('profiles').select('*').in('id', pendingIds);
    if (!profiles) return [];

    return profiles.map((p: any) => {
        const appProfile = mapDbProfileToApp(p);
        const { score, label, details } = calculateCompatibility(myProfile, appProfile);
        // Calculate distance for pending likes too
        const dist = calculateDistanceKm(myProfile.location, appProfile.location);
        
        const isSuper = incoming.find((s: any) => s.swiper_id === p.id && s.direction === 'super');
        return { ...appProfile, distanceKm: dist, compatibilityScore: score, compatibilityLabel: label, compatibilityDetails: details, hasSuperLikedUser: !!isSuper };
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

export const sendMessage = async (matchId: string, senderId: string, text: string, type: 'text' | 'image' | 'audio' = 'text', mediaUrl?: string): Promise<Message | null> => {
    const myProfile = await getMyProfile();
    if (myProfile) {
        const newAura = AuraEngine.updateAuraFromMessage(myProfile.aura, text);
        await updateMyProfile({ ...myProfile, aura: newAura });
    }
    const payload = { 
        match_id: matchId, 
        sender_id: senderId, 
        text, 
        type,
        media_url: mediaUrl 
    };
    const { data, error } = await supabase.from('messages').insert([payload]).select().single();
    return data ? mapDbMessageToApp(data) : null;
};

export const subscribeToChat = (matchId: string, callback: (msg: Message) => void) => {
    return supabase.channel(`chat:${matchId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` }, 
            (payload) => callback(mapDbMessageToApp(payload.new))
        ).subscribe();
}

const mapDbProfileToApp = (dbProfile: any): UserProfile => {
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
        voiceAuraUrl: dbProfile.voice_aura_url,
        // Mappage de la localisation
        location: (dbProfile.latitude && dbProfile.longitude) ? { latitude: dbProfile.latitude, longitude: dbProfile.longitude } : undefined,
        isPremium: dbProfile.is_premium,
        subscriptionTier: dbProfile.subscription_tier || (dbProfile.is_premium ? SubscriptionTier.GOLD : SubscriptionTier.FREE),
        dailyAuraAnswer: dbProfile.daily_aura_answer,
        isBoosted: dbProfile.is_boosted,
        isVerified: dbProfile.is_verified, // Verification Status
        aura: aura,
        notificationSettings: dbProfile.notification_settings,
        discoverySettings: dbProfile.discovery_settings
    };
};

const mapDbMessageToApp = (dbMsg: any): Message => ({
    id: dbMsg.id,
    senderId: dbMsg.sender_id === 'system' ? 'system' : dbMsg.sender_id, 
    text: dbMsg.text,
    type: dbMsg.type || 'text',
    mediaUrl: dbMsg.media_url,
    timestamp: new Date(dbMsg.created_at)
});
