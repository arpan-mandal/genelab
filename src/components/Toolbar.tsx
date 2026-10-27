import React from 'react';
import {
  FolderOpen,
  Dna,
  Binary,
  GitCompare,
  FileSearch,
  Download,
  Printer,
  Trash2,
} from 'lucide-react';
import { PRESET_SEQUENCES, PresetSequence } from '../bio/presets';
import { NavTabId } from './ToolNavigation';

interface ToolbarProps {
  currentTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  onOpenFilePicker: () => void;
  onLoadPreset: (preset: PresetSequence) => void;
  onExportTXT: () => void;
  onExportPDF: () => void;
  onPrint: () => void;
  onClear: () => void;
  hasSequence: boolean;
  sequenceName: string;
  sequenceLength: number;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenFilePicker,
  onLoadPreset,
  onExportTXT,
  onExportPDF,
  onPrint,
  onClear,
  hasSequence,
  sequenceName,
  sequenceLength,
}) => {
  return (
    <div className="no-print bg-slate-100 border-b border-slate-300 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
      {/* Left controls */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenFilePicker}
          className="btn-classic"
          title="Open FASTA or raw sequence file"
        >
          <FolderOpen className="w-3.5 h-3.5 text-slate-700" />
          <span>Open FASTA</span>
        </button>

        {/* Sample selector */}
        <select
          aria-label="Load example biological sequence"
          onChange={(e) => {
            const val = e.target.value;
            if (!val) return;
            const p = PRESET_SEQUENCES.find((s) => s.id === val);
            if (p) onLoadPreset(p);
            e.target.value = '';
          }}
          defaultValue=""
          className="bg-white border border-slate-400 px-2 py-1 text-xs text-slate-800 rounded-none focus:outline-none focus:border-slate-800 cursor-pointer"
        >
          <option value="" disabled>Load example sequence...</option>
          {PRESET_SEQUENCES.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name} ({preset.organism})
            </option>
          ))}
        </select>

        <div className="h-4 w-px bg-slate-300 mx-1"></div>

        {/* Action buttons */}
        <button
          type="button"
          onClick={() => onSelectTab('analyzer')}
          className={`btn-toolbar ${currentTab === 'analyzer' ? 'bg-slate-200 border-slate-400 font-semibold text-slate-900' : ''}`}
          title="Sequence Analyzer"
        >
          <Dna className="w-3.5 h-3.5 text-slate-700" />
          <span>Analyze</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('translation')}
          disabled={!hasSequence}
          className={`btn-toolbar ${currentTab === 'translation' ? 'bg-slate-200 border-slate-400 font-semibold text-slate-900' : ''}`}
          title="6-Frame Translation"
        >
          <Binary className="w-3.5 h-3.5 text-slate-700" />
          <span>Translate</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('comparison')}
          className={`btn-toolbar ${currentTab === 'comparison' ? 'bg-slate-200 border-slate-400 font-semibold text-slate-900' : ''}`}
          title="Pairwise Sequence Alignment"
        >
          <GitCompare className="w-3.5 h-3.5 text-slate-700" />
          <span>Align</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('orf')}
          disabled={!hasSequence}
          className={`btn-toolbar ${currentTab === 'orf' ? 'bg-slate-200 border-slate-400 font-semibold text-slate-900' : ''}`}
          title="Open Reading Frame Finder"
        >
          <FileSearch className="w-3.5 h-3.5 text-slate-700" />
          <span>Find ORFs</span>
        </button>

        <div className="h-4 w-px bg-slate-300 mx-1"></div>

        {/* Export actions */}
        <button
          type="button"
          disabled={!hasSequence}
          onClick={onExportTXT}
          className="btn-classic"
          title="Export formatted text report"
        >
          <Download className="w-3 h-3 text-slate-600" />
          <span>Export TXT</span>
        </button>

        <button
          type="button"
          disabled={!hasSequence}
          onClick={onExportPDF}
          className="btn-classic"
          title="Export vector PDF report"
        >
          <Download className="w-3 h-3 text-slate-600" />
          <span>Export PDF</span>
        </button>

        <button
          type="button"
          onClick={onPrint}
          className="btn-classic"
          title="Print analysis report"
        >
          <Printer className="w-3 h-3 text-slate-600" />
          <span>Print</span>
        </button>

        {hasSequence && (
          <button
            type="button"
            onClick={onClear}
            className="btn-classic text-rose-800 hover:text-rose-900"
            title="Clear sequence input"
          >
            <Trash2 className="w-3 h-3 text-rose-700" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Right: Active sequence status badge */}
      <div className="text-[11px] font-mono text-slate-600 flex items-center gap-2">
        {hasSequence ? (
          <>
            <span className="font-semibold text-slate-800 truncate max-w-[200px]" title={sequenceName}>
              {sequenceName}
            </span>
            <span className="bg-slate-200 text-slate-700 px-1.5 py-0.2 border border-slate-300">
              {sequenceLength} nt
            </span>
          </>
        ) : (
          <span className="italic text-slate-400">No sequence loaded</span>
        )}
      </div>
    </div>
  );
};
