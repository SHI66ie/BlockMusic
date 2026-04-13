import { useCallback, useState } from 'react';
import { useGenLayerContext } from '../contexts/GenLayerContext';

// ============================================================
// Core GenLayer Hook
/**
 * Core hook for GenLayer interactions.
 * Provides base functionality for reading and writing to GenLayer contracts.
 */
export function useGenLayer() {
  const { 
    isReady, 
    isLoading, 
    error, 
    contracts, 
    readContract, 
    writeContract, 
    waitForTransaction,
    clearError 
  } = useGenLayerContext();

  return {
    isReady,
    isLoading,
    error,
    contracts,
    readContract,
    writeContract,
    waitForTransaction,
    clearError,
  };
}

// ============================================================
// Content Moderation Hook
// ============================================================

export interface ModerationResult {
  status: 'APPROVED' | 'FLAGGED' | 'REVIEW' | 'NOT_MODERATED' | 'PENDING';
  reason?: string;
  raw: string;
}

/**
 * Hook for AI-powered content moderation via GenLayer.
 */
export function useContentModeration() {
  const { readContract, writeContract, waitForTransaction, contracts } = useGenLayerContext();
  const [isModeratingContent, setIsModeratingContent] = useState(false);
  const [moderationResult, setModerationResult] = useState<ModerationResult | null>(null);

  /**
   * Submit content for AI moderation.
   * Returns the moderation result after the GenLayer transaction finalizes.
   */
  const moderateContent = useCallback(
    async (params: {
      trackId: string;
      trackTitle: string;
      artistName: string;
      albumName: string;
      genre: string;
      description: string;
      isExplicit: boolean;
    }): Promise<ModerationResult> => {
      if (!contracts.contentModerator) {
        throw new Error('Content moderator contract not configured');
      }

      setIsModeratingContent(true);
      setModerationResult(null);

      try {
        // Submit moderation request
        const txHash = await writeContract(
          contracts.contentModerator,
          'moderate_content',
          [
            params.trackId,
            params.trackTitle,
            params.artistName,
            params.albumName,
            params.genre,
            params.description,
            params.isExplicit,
          ]
        );

        // Wait for transaction to finalize (AI processing happens on-chain)
        await waitForTransaction(txHash);

        // Read the result
        const raw = (await readContract(
          contracts.contentModerator,
          'get_moderation_result',
          [params.trackId]
        )) as string;

        const result = parseModerationResult(raw);
        setModerationResult(result);
        return result;
      } catch (err) {
        const errorResult: ModerationResult = {
          status: 'REVIEW',
          reason: err instanceof Error ? err.message : 'Moderation check failed',
          raw: 'ERROR',
        };
        setModerationResult(errorResult);
        return errorResult;
      } finally {
        setIsModeratingContent(false);
      }
    },
    [contracts.contentModerator, writeContract, waitForTransaction, readContract]
  );

  /**
   * Get the moderation result for a previously moderated track.
   */
  const getModerationResult = useCallback(
    async (trackId: string): Promise<ModerationResult> => {
      if (!contracts.contentModerator) {
        return { status: 'NOT_MODERATED', raw: '' };
      }

      try {
        const raw = (await readContract(
          contracts.contentModerator,
          'get_moderation_result',
          [trackId]
        )) as string;

        return parseModerationResult(raw);
      } catch {
        return { status: 'NOT_MODERATED', raw: '' };
      }
    },
    [contracts.contentModerator, readContract]
  );

  return {
    moderateContent,
    getModerationResult,
    isModeratingContent,
    moderationResult,
  };
}

/**
 * Parse raw moderation result string into structured data.
 */
function parseModerationResult(raw: string): ModerationResult {
  if (!raw || raw === 'NOT_MODERATED') {
    return { status: 'NOT_MODERATED', raw: raw || '' };
  }

  const upper = raw.toUpperCase().trim();

  if (upper === 'APPROVED') {
    return { status: 'APPROVED', raw };
  }

  if (upper.startsWith('FLAGGED')) {
    const reason = raw.includes(':') ? raw.split(':').slice(1).join(':').trim() : 'Policy violation';
    return { status: 'FLAGGED', reason, raw };
  }

  if (upper.startsWith('REVIEW')) {
    const reason = raw.includes(':') ? raw.split(':').slice(1).join(':').trim() : 'Needs review';
    return { status: 'REVIEW', reason, raw };
  }

  return { status: 'REVIEW', reason: 'Unknown status', raw };
}


// ============================================================
// Copyright Verification Hook
// ============================================================

export interface CopyrightResult {
  status: 'CLEAR' | 'COVER' | 'FLAGGED' | 'NOT_VERIFIED' | 'PENDING';
  details?: string;
  raw: string;
}

/**
 * Hook for AI-powered copyright verification via GenLayer.
 */
export function useCopyrightVerification() {
  const { readContract, writeContract, waitForTransaction, contracts } = useGenLayerContext();
  const [isVerifying, setIsVerifying] = useState(false);
  const [copyrightResult, setCopyrightResult] = useState<CopyrightResult | null>(null);

  const verifyCopyright = useCallback(
    async (params: {
      trackId: string;
      trackTitle: string;
      artistName: string;
      claimedOriginal: boolean;
      sampleSources: string;
    }): Promise<CopyrightResult> => {
      if (!contracts.copyrightVerifier) {
        return { status: 'NOT_VERIFIED', raw: '' };
      }

      setIsVerifying(true);
      setCopyrightResult(null);

      try {
        const txHash = await writeContract(
          contracts.copyrightVerifier,
          'verify_copyright',
          [
            params.trackId,
            params.trackTitle,
            params.artistName,
            params.claimedOriginal,
            params.sampleSources,
          ]
        );

        await waitForTransaction(txHash);

        const raw = (await readContract(
          contracts.copyrightVerifier,
          'get_verification_result',
          [params.trackId]
        )) as string;

        const result = parseCopyrightResult(raw);
        setCopyrightResult(result);
        return result;
      } catch (err) {
        const errorResult: CopyrightResult = {
          status: 'NOT_VERIFIED',
          details: err instanceof Error ? err.message : 'Verification failed',
          raw: 'ERROR',
        };
        setCopyrightResult(errorResult);
        return errorResult;
      } finally {
        setIsVerifying(false);
      }
    },
    [contracts.copyrightVerifier, writeContract, waitForTransaction, readContract]
  );

  return {
    verifyCopyright,
    isVerifying,
    copyrightResult,
  };
}

function parseCopyrightResult(raw: string): CopyrightResult {
  if (!raw || raw === 'NOT_VERIFIED') {
    return { status: 'NOT_VERIFIED', raw: raw || '' };
  }

  const upper = raw.toUpperCase().trim();

  if (upper === 'CLEAR') return { status: 'CLEAR', raw };
  if (upper === 'COVER') return { status: 'COVER', details: 'May need license for cover/remix', raw };
  if (upper.startsWith('FLAGGED')) {
    const details = raw.includes(':') ? raw.split(':').slice(1).join(':').trim() : 'Potential infringement';
    return { status: 'FLAGGED', details, raw };
  }

  return { status: 'NOT_VERIFIED', raw };
}


// ============================================================
// Artist Verification Hook
// ============================================================

export interface ArtistVerificationResult {
  status: 'VERIFIED' | 'PENDING' | 'REJECTED' | 'NOT_REQUESTED';
  artistName?: string;
  raw: string;
}

/**
 * Hook for AI-powered artist identity verification via GenLayer.
 */
export function useArtistVerification() {
  const { readContract, writeContract, waitForTransaction, contracts } = useGenLayerContext();
  const [isVerifyingArtist, setIsVerifyingArtist] = useState(false);
  const [artistVerificationResult, setArtistVerificationResult] = useState<ArtistVerificationResult | null>(null);

  const requestVerification = useCallback(
    async (params: {
      artistName: string;
      twitterHandle: string;
      websiteUrl: string;
      walletAddress: string;
    }): Promise<ArtistVerificationResult> => {
      if (!contracts.artistVerifier) {
        return { status: 'NOT_REQUESTED', raw: '' };
      }

      setIsVerifyingArtist(true);
      setArtistVerificationResult(null);

      try {
        const txHash = await writeContract(
          contracts.artistVerifier,
          'request_verification',
          [
            params.artistName,
            params.twitterHandle,
            params.websiteUrl,
            params.walletAddress,
          ]
        );

        await waitForTransaction(txHash);

        const raw = (await readContract(
          contracts.artistVerifier,
          'get_verification_status',
          [params.walletAddress]
        )) as string;

        const result = parseArtistVerification(raw);
        setArtistVerificationResult(result);
        return result;
      } catch (err) {
        const errorResult: ArtistVerificationResult = {
          status: 'NOT_REQUESTED',
          raw: err instanceof Error ? err.message : 'Verification failed',
        };
        setArtistVerificationResult(errorResult);
        return errorResult;
      } finally {
        setIsVerifyingArtist(false);
      }
    },
    [contracts.artistVerifier, writeContract, waitForTransaction, readContract]
  );

  const checkVerification = useCallback(
    async (artistAddress: `0x${string}`): Promise<boolean> => {
      if (!contracts.artistVerifier) return false;

      try {
        const result = await readContract(contracts.artistVerifier, 'is_verified', [artistAddress]);
        return result as boolean;
      } catch {
        return false;
      }
    },
    [contracts.artistVerifier, readContract]
  );

  return {
    requestVerification,
    checkVerification,
    isVerifyingArtist,
    artistVerificationResult,
  };
}

function parseArtistVerification(raw: string): ArtistVerificationResult {
  try {
    const data = JSON.parse(raw);
    return {
      status: (data.status || 'NOT_REQUESTED') as ArtistVerificationResult['status'],
      artistName: data.artist_name,
      raw,
    };
  } catch {
    return { status: 'NOT_REQUESTED', raw };
  }
}


// ============================================================
// Music Recommendations Hook
// ============================================================

export interface RecommendationResult {
  trackIds: string[];
  raw: string;
}

/**
 * Hook for AI-powered music recommendations via GenLayer.
 */
export function useRecommendations() {
  const { readContract, writeContract, waitForTransaction, contracts } = useGenLayerContext();
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);

  const getRecommendations = useCallback(
    async (params: {
      genresListened: string;
      favoriteArtists: string;
      recentTracks: string;
      availableTrackIds: string;
    }): Promise<RecommendationResult> => {
      if (!contracts.musicRecommender) {
        return { trackIds: [], raw: '' };
      }

      setIsLoadingRecs(true);

      try {
        const txHash = await writeContract(
          contracts.musicRecommender,
          'get_recommendations',
          [
            params.genresListened,
            params.favoriteArtists,
            params.recentTracks,
            params.availableTrackIds,
          ]
        );

        await waitForTransaction(txHash);

        // Read the updated profile which contains recommendations
        const raw = (await readContract(
          contracts.musicRecommender,
          'get_user_profile',
          [] // caller's address is implicit
        )) as string;

        const result = parseRecommendations(raw);
        setRecommendations(result);
        return result;
      } catch {
        return { trackIds: [], raw: '' };
      } finally {
        setIsLoadingRecs(false);
      }
    },
    [contracts.musicRecommender, writeContract, waitForTransaction, readContract]
  );

  return {
    getRecommendations,
    isLoadingRecs,
    recommendations,
  };
}

function parseRecommendations(raw: string): RecommendationResult {
  try {
    const data = JSON.parse(raw);
    const recs = data.recommendations || '';
    const trackIds = recs
      .split(',')
      .map((id: string) => id.trim())
      .filter((id: string) => id.length > 0);
    return { trackIds, raw };
  } catch {
    return { trackIds: [], raw };
  }
}
