import React from 'react';
import { NucleotideStats } from '../bio/types';
import { NavTabId } from './ToolNavigation';

interface StatusBarProps {
  currentTab: NavTabId;
  hasSequence: boolean;
  sequenceName: string;
  stats: NucleotideStats;
  isValid: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  currentTab,
  hasSequence,
  sequenceName,
  stats,
  isValid,
}) => {
  const tabNames: Record<NavTabId, string> = {
    analyzer: 'Sequence Analyzer',
    translation: '6-Frame Translation',
    comparison: 'Pairwise Alignment (Needleman–Wunsch)',
    orf: 'ORF Finder',
    genes: 'Gene & Transcript Explorer (Ensembl / NCBI)',
    proteins: 'Protein & 3D Structure Explorer (UniProt / RCSB)',
    literature: 'Scientific Literature (PubMed / Europe PMC)',
    compounds: 'Chemical Compound Explorer (PubChem)',
    pathways: 'Pathways & Interaction Networks (STRING / Reactome)',
    learning: 'Learning Center Reference',
    about: 'System Specifications',
  };

  return (
    <footer aria-label="Application status" className="no-print bg-slate-200 border-t border-slate-300 text-[11px] text-slate-700 py-1 px-3 flex flex-wrap items-center justify-between gap-3 font-mono select-none">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 font-sans font-medium text-slate-900">
          <span className={`w-2 h-2 inline-block rounded-full ${isValid && hasSequence ? 'bg-emerald-600' : hasSequence ? 'bg-amber-600' : 'bg-slate-400'}`}></span>
          <span>{hasSequence ? (isValid ? 'Ready / Valid sequence' : 'Validation Error') : 'Ready (No sequence)'}</span>
        </span>

        <span className="text-slate-300">|</span>

        <span>Tool: <strong className="text-slate-900">{tabNames[currentTab]}</strong></span>
      </div>

      <div className="flex items-center gap-3">
        {hasSequence ? (
          <>
            <span className="truncate max-w-[140px]" title={sequenceName}>{sequenceName}</span>
            <span className="text-slate-300">|</span>
            <span>Length: <strong>{stats.totalLength} nt</strong></span>
            <span className="text-slate-300">|</span>
            <span>GC: <strong>{stats.gcContent.standard}%</strong></span>
            <span className="text-slate-300">|</span>
            <span>A:{stats.counts.A} T:{stats.counts.T} G:{stats.counts.G} C:{stats.counts.C}</span>
            {stats.ambiguousLength > 0 && (
              <>
                <span className="text-slate-300">|</span>
                <span className="text-amber-800">Ambiguous: {stats.ambiguousLength}</span>
              </>
            )}
            <span className="text-slate-300">|</span>
            <span>Mol Wt: ~{stats.molecularWeightEstimatedDa.toLocaleString()} Da</span>
          </>
        ) : (
          <span>Awaiting DNA input</span>
        )}

        <span className="text-slate-300">|</span>
        <span className="text-slate-500 font-sans">Local Browser Execution</span>
      </div>
    </footer>
  );
};
