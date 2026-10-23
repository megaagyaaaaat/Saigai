import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  subtext?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Retrieving Geospatial Telemetry...',
  subtext = 'Querying sensor arrays & satellite radar feeds',
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-xl bg-ner-panel/50 border border-ner-border ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="relative w-12 h-12 mb-4 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-ner-cyan/30 animate-ping opacity-30" />
        <div className="absolute inset-0 rounded-full border-2 border-ner-blue/20 border-t-ner-cyan animate-spin" />
        <Loader2 className="w-6 h-6 text-ner-cyan animate-spin" />
      </div>
      <p className="font-mono text-sm font-semibold text-ner-text tracking-wide">{message}</p>
      {subtext && <p className="text-xs text-ner-muted mt-1 max-w-xs">{subtext}</p>}
    </div>
  );
};
