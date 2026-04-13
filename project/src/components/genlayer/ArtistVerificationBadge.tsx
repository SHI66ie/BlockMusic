import React from 'react';
import { FiCheckCircle, FiClock, FiXCircle, FiExternalLink } from 'react-icons/fi';
import { ArtistVerificationResult } from '../../hooks/useGenLayer';

// ============================================================
// Artist Verification Badge Component
// ============================================================

interface ArtistVerificationBadgeProps {
  isVerified: boolean;
  result?: ArtistVerificationResult | null;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ArtistVerificationBadge({
  isVerified,
  result,
  isLoading = false,
  size = 'sm',
}: ArtistVerificationBadgeProps) {
  const sizeMap = {
    sm: { icon: 14, fontSize: '11px', padding: '2px 8px' },
    md: { icon: 16, fontSize: '13px', padding: '4px 12px' },
    lg: { icon: 18, fontSize: '14px', padding: '6px 16px' },
  };

  const dims = sizeMap[size];

  if (isLoading) {
    return (
      <span
        id="artist-verification-badge-loading"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: dims.padding,
          backgroundColor: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          borderRadius: '9999px',
          fontSize: dims.fontSize,
          fontWeight: 500,
          color: '#818cf8',
        }}
      >
        <FiClock size={dims.icon} />
        Verifying...
      </span>
    );
  }

  if (isVerified) {
    return (
      <span
        id="artist-verification-badge-verified"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: dims.padding,
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
          border: '1px solid rgba(99, 102, 241, 0.5)',
          borderRadius: '9999px',
          fontSize: dims.fontSize,
          fontWeight: 600,
          color: '#a78bfa',
          boxShadow: '0 0 12px rgba(99, 102, 241, 0.25)',
        }}
        title="Verified by GenLayer AI"
      >
        <FiCheckCircle size={dims.icon} />
        AI Verified
      </span>
    );
  }

  if (result?.status === 'REJECTED') {
    return (
      <span
        id="artist-verification-badge-rejected"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: dims.padding,
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '9999px',
          fontSize: dims.fontSize,
          fontWeight: 500,
          color: '#f87171',
        }}
      >
        <FiXCircle size={dims.icon} />
        Not Verified
      </span>
    );
  }

  return null;
}


// ============================================================
// Artist Verification Request Form
// ============================================================

interface ArtistVerificationFormProps {
  onSubmit: (data: {
    artistName: string;
    twitterHandle: string;
    websiteUrl: string;
    walletAddress: string;
  }) => Promise<void>;
  isLoading: boolean;
  result: ArtistVerificationResult | null;
  walletAddress?: string;
}

export function ArtistVerificationForm({
  onSubmit,
  isLoading,
  result,
  walletAddress,
}: ArtistVerificationFormProps) {
  const [artistName, setArtistName] = React.useState('');
  const [twitterHandle, setTwitterHandle] = React.useState('');
  const [websiteUrl, setWebsiteUrl] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) return;

    await onSubmit({
      artistName,
      twitterHandle,
      websiteUrl,
      walletAddress,
    });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '10px',
    color: '#f8fafc',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: '#94a3b8',
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '4px',
  };

  return (
    <div
      id="artist-verification-form"
      style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.08))',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: '16px',
        padding: '24px',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FiCheckCircle size={22} color="white" />
        </div>
        <div>
          <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '18px', fontWeight: 600 }}>
            GenLayer Artist Verification
          </h3>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>
            Get verified through AI-powered social proof analysis
          </p>
        </div>
      </div>

      {result && (
        <div
          style={{
            padding: '12px',
            borderRadius: '10px',
            marginBottom: '16px',
            backgroundColor:
              result.status === 'VERIFIED'
                ? 'rgba(16, 185, 129, 0.1)'
                : result.status === 'REJECTED'
                  ? 'rgba(239, 68, 68, 0.1)'
                  : 'rgba(245, 158, 11, 0.1)',
            border: `1px solid ${
              result.status === 'VERIFIED'
                ? 'rgba(16, 185, 129, 0.3)'
                : result.status === 'REJECTED'
                  ? 'rgba(239, 68, 68, 0.3)'
                  : 'rgba(245, 158, 11, 0.3)'
            }`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArtistVerificationBadge isVerified={result.status === 'VERIFIED'} result={result} size="md" />
            {result.artistName && (
              <span style={{ color: '#cbd5e1', fontSize: '13px' }}>for {result.artistName}</span>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Artist / Stage Name *</label>
            <input
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Your artist name"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Twitter / X Handle</label>
            <input
              type="text"
              value={twitterHandle}
              onChange={(e) => setTwitterHandle(e.target.value)}
              placeholder="username (without @)"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Website URL</label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yourwebsite.com"
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !artistName || !walletAddress}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              border: 'none',
              background: isLoading
                ? 'rgba(99, 102, 241, 0.3)'
                : 'linear-gradient(135deg, #6366f1, #a855f7)',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: isLoading ? 'wait' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isLoading ? (
              <>
                <FiClock size={16} />
                GenLayer AI is verifying...
              </>
            ) : (
              <>
                <FiExternalLink size={16} />
                Request AI Verification
              </>
            )}
          </button>
        </div>
      </form>

      <p style={{ margin: '12px 0 0', color: '#64748b', fontSize: '11px', lineHeight: 1.4 }}>
        GenLayer validators will use AI to verify your identity by checking your social media profiles 
        and cross-referencing them with your wallet address. This process is fully on-chain.
      </p>
    </div>
  );
}
