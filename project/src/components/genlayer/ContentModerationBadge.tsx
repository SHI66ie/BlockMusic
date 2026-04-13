import React from 'react';
import { ModerationResult } from '../../hooks/useGenLayer';
import { FiShield, FiAlertTriangle, FiCheckCircle, FiClock, FiHelpCircle } from 'react-icons/fi';

// ============================================================
// Content Moderation Badge Component
// ============================================================

interface ContentModerationBadgeProps {
  result: ModerationResult | null;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const statusConfig = {
  APPROVED: {
    icon: FiCheckCircle,
    label: 'AI Approved',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.5)',
    textColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.3)',
  },
  FLAGGED: {
    icon: FiAlertTriangle,
    label: 'Flagged',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
    textColor: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.3)',
  },
  REVIEW: {
    icon: FiClock,
    label: 'Under Review',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.5)',
    textColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.3)',
  },
  NOT_MODERATED: {
    icon: FiHelpCircle,
    label: 'Not Moderated',
    bgColor: 'rgba(107, 114, 128, 0.15)',
    borderColor: 'rgba(107, 114, 128, 0.5)',
    textColor: '#6b7280',
    glowColor: 'rgba(107, 114, 128, 0.2)',
  },
  PENDING: {
    icon: FiClock,
    label: 'Processing...',
    bgColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: 'rgba(99, 102, 241, 0.5)',
    textColor: '#6366f1',
    glowColor: 'rgba(99, 102, 241, 0.3)',
  },
};

const sizeConfig = {
  sm: { padding: '2px 8px', fontSize: '11px', iconSize: 12, gap: '4px' },
  md: { padding: '4px 12px', fontSize: '13px', iconSize: 14, gap: '6px' },
  lg: { padding: '6px 16px', fontSize: '14px', iconSize: 16, gap: '8px' },
};

export function ContentModerationBadge({ 
  result, 
  isLoading = false, 
  size = 'md',
  showLabel = true 
}: ContentModerationBadgeProps) {
  const status = isLoading ? 'PENDING' : (result?.status || 'NOT_MODERATED');
  const config = statusConfig[status];
  const dimensions = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div
      id="content-moderation-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: dimensions.gap,
        padding: dimensions.padding,
        backgroundColor: config.bgColor,
        border: `1px solid ${config.borderColor}`,
        borderRadius: '9999px',
        fontSize: dimensions.fontSize,
        fontWeight: 500,
        color: config.textColor,
        boxShadow: `0 0 8px ${config.glowColor}`,
        transition: 'all 0.3s ease',
        cursor: result?.reason ? 'pointer' : 'default',
        position: 'relative',
      }}
      title={result?.reason || config.label}
    >
      {isLoading ? (
        <div
          style={{
            width: dimensions.iconSize,
            height: dimensions.iconSize,
            border: `2px solid ${config.textColor}`,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
      ) : (
        <Icon size={dimensions.iconSize} />
      )}
      
      {showLabel && (
        <span style={{ whiteSpace: 'nowrap' }}>
          {isLoading ? 'AI Analyzing...' : config.label}
        </span>
      )}

      {/* GenLayer badge */}
      <FiShield size={dimensions.iconSize - 2} style={{ opacity: 0.6, marginLeft: '2px' }} />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// Content Moderation Panel (for Upload page)
// ============================================================

interface ContentModerationPanelProps {
  result: ModerationResult | null;
  isLoading: boolean;
  onRetry?: () => void;
}

export function ContentModerationPanel({ result, isLoading, onRetry }: ContentModerationPanelProps) {
  if (!result && !isLoading) return null;

  const status = isLoading ? 'PENDING' : (result?.status || 'NOT_MODERATED');
  const config = statusConfig[status];

  return (
    <div
      id="content-moderation-panel"
      style={{
        background: `linear-gradient(135deg, ${config.bgColor}, rgba(15, 23, 42, 0.6))`,
        border: `1px solid ${config.borderColor}`,
        borderRadius: '16px',
        padding: '20px',
        marginTop: '16px',
        backdropFilter: 'blur(10px)',
        boxShadow: `0 4px 24px ${config.glowColor}`,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: config.bgColor,
            border: `1px solid ${config.borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FiShield size={20} color={config.textColor} />
        </div>
        <div>
          <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '16px', fontWeight: 600 }}>
            GenLayer AI Moderation
          </h3>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>
            Powered by on-chain AI with validator consensus
          </p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <ContentModerationBadge result={result} isLoading={isLoading} size="lg" />
        </div>
      </div>

      {/* Details */}
      {result?.reason && (
        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginTop: '12px',
          }}
        >
          <p style={{ margin: 0, color: '#cbd5e1', fontSize: '13px', lineHeight: 1.5 }}>
            <strong style={{ color: config.textColor }}>Details:</strong> {result.reason}
          </p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div style={{ marginTop: '12px' }}>
          <div
            style={{
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: '30%',
                backgroundColor: config.textColor,
                borderRadius: '2px',
                animation: 'shimmer 1.5s ease-in-out infinite',
              }}
            />
          </div>
          <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: '12px' }}>
            GenLayer validators are processing your content through AI analysis...
          </p>
        </div>
      )}

      {/* Retry button for failed moderation */}
      {result?.status === 'REVIEW' && onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: '12px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: `1px solid ${config.borderColor}`,
            backgroundColor: config.bgColor,
            color: config.textColor,
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          Retry Moderation
        </button>
      )}

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
