import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Data Ingestion Notice',
  message = 'Telemetry stream temporarily unavailable for this geographic region.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`p-5 rounded-xl bg-ner-red/10 border border-ner-red/30 text-ner-text ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-ner-red flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-sm text-ner-red tracking-wide">{title}</h4>
          <p className="text-xs text-ner-muted mt-1 leading-relaxed">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ner-panel border border-ner-border text-xs font-mono font-medium text-ner-cyan hover:bg-ner-surface transition-colors ner-focus"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Telemetry Fetch</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
