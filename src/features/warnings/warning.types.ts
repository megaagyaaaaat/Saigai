export type WarningAlertLevel = 'advisory' | 'watch' | 'warning' | 'emergency';

export interface WarningRecord {
  id: string;
  regionId: string;
  level: WarningAlertLevel;
  title: string;
  issuedAt: string;
  expiresAt: string;
  summary: string;
  confidence: 'low' | 'medium' | 'high';
  recommendedAction: string;
  affectedCorridor: string;
  sourceAuthority: string;
}
