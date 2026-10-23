import React from 'react';
import { X, Globe2, ShieldAlert, Cpu, Database, CheckCircle2 } from 'lucide-react';
import { APP_CONFIG } from '../../api/apiConfig';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-ner-panel border border-ner-border rounded-2xl shadow-panel overflow-hidden text-ner-text flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-ner-border flex items-center justify-between bg-ner-surface/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-ner-cyan/15 border border-ner-cyan/30 flex items-center justify-center text-ner-cyan">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-ner-text">NER-LEWS System Architecture</h3>
              <p className="text-xs text-ner-muted font-mono">
                Northeast India Landslide Early Warning System
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ner-muted hover:text-ner-text hover:bg-ner-surface transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Section 1: Core Paradigm */}
          <div className="space-y-2">
            <h4 className="font-mono text-xs font-semibold text-ner-cyan uppercase tracking-wider flex items-center gap-1.5">
              <Globe2 className="w-4 h-4" />
              <span>Geospatial Core: Region-Based, NOT State-Based</span>
            </h4>
            <p className="text-ner-muted leading-relaxed">
              NER-LEWS models landslide vulnerability based on authentic geological structures, watershed basins, mountain passes, and geotechnical corridors (e.g. the Shillong Plateau Escarpment, Barail Range, Teesta Gorge, and Siang Canyon) rather than artificial administrative state borders. Many critical landslide corridors cross multiple states seamlessly.
            </p>
          </div>

          {/* Section 2: Drawing and Spatial Queries */}
          <div className="p-4 rounded-xl bg-ner-surface/70 border border-ner-border space-y-2">
            <h5 className="font-semibold text-ner-text flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-ner-cyan" />
              <span>Interactive Polygon Drawing & Spatial Queries</span>
            </h5>
            <p className="text-ner-muted leading-relaxed">
              Users can draw arbitrary polygons anywhere across Northeast India. The client calculates geometric bounds and surface area in km² using computational geometry algorithms, and conducts real-time point-in-polygon queries to isolate enclosed sensor stations and historical landslide events.
            </p>
          </div>

          {/* Section 3: Satellite Imagery Licensing */}
          <div className="p-4 rounded-xl bg-ner-surface/70 border border-ner-border space-y-2">
            <h5 className="font-semibold text-ner-text flex items-center gap-2">
              <Database className="w-4 h-4 text-ner-blue" />
              <span>Satellite Imagery Attribution & Verification</span>
            </h5>
            <p className="text-ner-muted leading-relaxed font-mono text-[11px]">
              {APP_CONFIG.satelliteAttribution}
            </p>
            <p className="text-[11px] text-ner-muted">
              Imagery is served via high-resolution raster tiles rendered in GPU-accelerated WebGL with custom dark command center color grading.
            </p>
          </div>

          {/* Section 4: Backend Integration Readiness */}
          <div className="p-4 rounded-xl bg-ner-surface/70 border border-ner-border space-y-2">
            <h5 className="font-semibold text-ner-text flex items-center gap-2">
              <Cpu className="w-4 h-4 text-ner-emerald" />
              <span>Future Backend Integration Boundary</span>
            </h5>
            <p className="text-ner-muted leading-relaxed">
              The frontend is completely isolated from live backend models. All telemetry and historical records are accessed through a typed service abstraction (<code className="text-ner-cyan font-mono">dataProvider</code>), ready to switch from mock fixtures to live REST/gRPC endpoints by simply updating <code className="text-ner-cyan font-mono">VITE_DATA_MODE=live</code>. Proposed endpoints are documented in <code className="text-ner-cyan font-mono">docs/API_CONTRACT_PROPOSAL.md</code>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-ner-border bg-ner-surface/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-ner-cyan text-ner-bg font-mono font-bold text-xs hover:brightness-110 transition-all shadow-glow-cyan"
          >
            Acknowledge & Return to Map
          </button>
        </div>
      </div>
    </div>
  );
};
