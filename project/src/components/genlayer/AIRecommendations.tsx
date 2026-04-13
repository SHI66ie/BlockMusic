import React, { useEffect, useState } from 'react';
import { useRecommendations, RecommendationResult } from '../../hooks/useGenLayer';
import { FiMusic, FiRefreshCw, FiZap, FiStar } from 'react-icons/fi';

// ============================================================
// AI Recommendations Panel Component
// ============================================================

interface AIRecommendationsProps {
  /** User's listened genres (comma separated) */
  genresListened?: string;
  /** User's favorite artists (comma separated) */
  favoriteArtists?: string;
  /** Recently played track IDs (comma separated) */
  recentTracks?: string;
  /** Available track IDs on the platform (comma separated) */
  availableTrackIds?: string;
  /** Callback when a recommended track is clicked */
  onTrackSelect?: (trackId: string) => void;
}

export function AIRecommendations({
  genresListened = '',
  favoriteArtists = '',
  recentTracks = '',
  availableTrackIds = '',
  onTrackSelect,
}: AIRecommendationsProps) {
  const { getRecommendations, isLoadingRecs, recommendations } = useRecommendations();
  const [hasRequested, setHasRequested] = useState(false);

  const handleGetRecommendations = async () => {
    setHasRequested(true);
    await getRecommendations({
      genresListened,
      favoriteArtists,
      recentTracks,
      availableTrackIds,
    });
  };

  return (
    <div
      id="ai-recommendations-panel"
      style={{
        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.08), rgba(168, 85, 247, 0.08), rgba(59, 130, 246, 0.08))',
        border: '1px solid rgba(168, 85, 247, 0.2)',
        borderRadius: '20px',
        padding: '24px',
        backdropFilter: 'blur(12px)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative background gradient */}
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15), transparent)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', position: 'relative' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #ec4899, #a855f7, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(168, 85, 247, 0.3)',
          }}
        >
          <FiZap size={24} color="white" />
        </div>
        <div>
          <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '18px', fontWeight: 700 }}>
            AI-Powered Recommendations
          </h3>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>
            Personalized picks by GenLayer on-chain AI
          </p>
        </div>
      </div>

      {/* Not requested state */}
      {!hasRequested && !isLoadingRecs && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <FiStar size={28} color="#a855f7" />
          </div>
          <p style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '16px', lineHeight: 1.5 }}>
            Discover new music tailored to your taste using AI that runs
            directly on the blockchain with validator consensus.
          </p>
          <button
            onClick={handleGetRecommendations}
            style={{
              padding: '12px 28px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #ec4899, #a855f7)',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(168, 85, 247, 0.3)',
            }}
          >
            <FiZap size={16} />
            Get AI Recommendations
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoadingRecs && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              border: '3px solid rgba(168, 85, 247, 0.2)',
              borderTopColor: '#a855f7',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: '#a855f7', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
            GenLayer AI is analyzing your taste...
          </p>
          <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>
            On-chain AI processing with validator consensus
          </p>
        </div>
      )}

      {/* Results */}
      {recommendations && recommendations.trackIds.length > 0 && !isLoadingRecs && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recommendations.trackIds.map((trackId, index) => (
              <button
                key={trackId}
                onClick={() => onTrackSelect?.(trackId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  backgroundColor: 'rgba(15, 23, 42, 0.4)',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  width: '100%',
                  textAlign: 'left',
                  color: '#f8fafc',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: `linear-gradient(135deg, hsl(${260 + index * 30}, 70%, 55%), hsl(${280 + index * 30}, 70%, 55%))`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <FiMusic size={16} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>
                    Track #{trackId}
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                    AI Match #{index + 1}
                  </p>
                </div>
                <span style={{ color: '#a855f7', fontSize: '12px', fontWeight: 500 }}>
                  Play →
                </span>
              </button>
            ))}
          </div>

          {/* Refresh button */}
          <button
            onClick={handleGetRecommendations}
            disabled={isLoadingRecs}
            style={{
              width: '100%',
              marginTop: '12px',
              padding: '10px',
              borderRadius: '10px',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              backgroundColor: 'rgba(168, 85, 247, 0.1)',
              color: '#a855f7',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <FiRefreshCw size={14} />
            Refresh Recommendations
          </button>
        </div>
      )}

      {/* No results */}
      {recommendations && recommendations.trackIds.length === 0 && !isLoadingRecs && hasRequested && (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            No recommendations available yet. Listen to more music to get personalized suggestions!
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
