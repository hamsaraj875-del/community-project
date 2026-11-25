import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

export const AI_STATUS_CONFIG = {
  matched: {
    label: 'Image Matched',
    badgeClass: 'ai-badge-matched',
    reasonClass: 'ai-reason-matched',
    icon: CheckCircle2,
    color: '#15803d',
    bgColor: '#dcfce7',
  },
  mismatch_detected: {
    label: 'Mismatch Detected',
    badgeClass: 'ai-badge-mismatch',
    reasonClass: 'ai-reason-mismatch',
    icon: XCircle,
    color: '#b91c1c',
    bgColor: '#fee2e2',
  },
  needs_review: {
    label: 'Needs Review',
    badgeClass: 'ai-badge-review',
    reasonClass: 'ai-reason-review',
    icon: AlertTriangle,
    color: '#b45309',
    bgColor: '#fef3c7',
  },
  verification_failed: {
    label: 'Verification Pending',
    badgeClass: 'ai-badge-pending',
    reasonClass: 'ai-reason-review',
    icon: Clock,
    color: '#64748b',
    bgColor: '#f1f5f9',
  },
  pending: {
    label: 'Verification Pending',
    badgeClass: 'ai-badge-pending',
    reasonClass: 'ai-reason-review',
    icon: Clock,
    color: '#64748b',
    bgColor: '#f1f5f9',
  },
};

export default function AIVerificationBadge({ status, score, showScore = false }) {
  const config = AI_STATUS_CONFIG[status] || AI_STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <span className={`ai-badge ${config.badgeClass}`} title={config.label}>
      <Icon size={12} style={{ flexShrink: 0 }} />
      <span>{config.label}</span>
      {showScore && score !== null && score !== undefined && (
        <span style={{ opacity: 0.85, fontSize: '10.5px' }}>
          ({Math.round(score * 100)}%)
        </span>
      )}
    </span>
  );
}
