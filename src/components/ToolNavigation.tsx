import React from 'react';
import {
  Dna,
  Binary,
  GitCompare,
  FileSearch,
  BookOpen,
  Info,
  Database,
  Box,
  FlaskConical,
  Network,
  Library,
} from 'lucide-react';
import { NucleotideStats } from '../bio/types';

export type NavTabId =
  | 'analyzer'
  | 'translation'
  | 'comparison'
  | 'orf'
  | 'genes'
  | 'proteins'
  | 'literature'
  | 'compounds'
  | 'pathways'
  | 'learning'
  | 'about';

interface ToolNavigationProps {
  currentTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  hasSequence: boolean;
  sequenceName: string;
  stats: NucleotideStats;
  onClear: () => void;
}

export const ToolNavigation: React.FC<ToolNavigationProps> = ({
  currentTab,
  onSelectTab,
  hasSequence,
  sequenceName,
  stats,
  onClear,
}) => {
  const sequenceTools: { id: NavTabId; label: string; icon: React.ReactNode; requiresSequence?: boolean }[] = [
    { id: 'analyzer', label: 'Sequence Analyzer', icon: <Dna className="w-3.5 h-3.5" /> },
    { id: 'translation', label: 'Translation & Frames', icon: <Binary className="w-3.5 h-3.5" />, requiresSequence: true },
    { id: 'comparison', label: 'Alignment (Needleman–Wunsch)', icon: <GitCompare className="w-3.5 h-3.5" /> },
    { id: 'orf', label: 'ORF Finder', icon: <FileSearch className="w-3.5 h-3.5" />, requiresSequence: true },
  ];

  const databaseExplorers: { id: NavTabId; label: string; icon: React.ReactNode; badge: string }[] = [
    { id: 'genes', label: 'Genes & Transcripts', icon: <Database className="w-3.5 h-3.5" />, badge: 'Ensembl' },
    { id: 'proteins', label: 'Proteins & 3D PDB', icon: <Box className="w-3.5 h-3.5" />, badge: 'UniProt' },
    { id: 'literature', label: 'Scientific Literature', icon: <Library className="w-3.5 h-3.5" />, badge: 'PubMed' },
    { id: 'compounds', label: 'Chemical Compounds', icon: <FlaskConical className="w-3.5 h-3.5" />, badge: 'PubChem' },
    { id: 'pathways', label: 'Pathways & Networks', icon: <Network className="w-3.5 h-3.5" />, badge: 'STRING' },
  ];

  const documentationTools: { id: NavTabId; label: string; icon: React.ReactNode }[] = [
    { id: 'learning', label: 'Reference Manual', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'about', label: 'Project Specifications', icon: <Info className="w-3.5 h-3.5" /> },
  ];

  return (
    <nav aria-label="Tool selection" className="w-60 shrink-0 bg-slate-50 border-r border-slate-300 flex flex-col justify-between text-xs font-sans select-none overflow-y-auto">
      <div>
        {/* Section 1: Sequence Tools */}
        <div className="bg-slate-200 border-b border-slate-300 px-3 py-1.5 font-bold text-slate-800 text-[10px] uppercase tracking-wider flex items-center justify-between">
          <span>Analysis Workstation</span>
          <span className="text-[10px] text-slate-500 font-mono">4 tools</span>
        </div>

        <div className="py-0.5">
          {sequenceTools.map((tool) => {
            const isActive = currentTab === tool.id;
            const isDisabled = tool.requiresSequence && !hasSequence;

            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => onSelectTab(tool.id)}
                disabled={isDisabled}
                className={`w-full text-left px-3 py-1.5 flex items-center gap-2 border-b border-slate-200 last:border-b-0 cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-slate-300 font-semibold text-slate-900 border-l-4 border-l-slate-800'
                    : isDisabled
                    ? 'text-slate-400 bg-slate-50 cursor-not-allowed'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className={isActive ? 'text-slate-900' : 'text-slate-500'}>
                  {tool.icon}
                </span>
                <span className="truncate">{tool.label}</span>
              </button>
            );
          })}
        </div>

        {/* Section 2: Database Explorers */}
        <div className="bg-slate-200 border-t border-b border-slate-300 px-3 py-1.5 font-bold text-slate-800 text-[10px] uppercase tracking-wider flex items-center justify-between mt-1">
          <span>Database Explorers</span>
          <span className="text-[10px] text-emerald-800 font-mono font-bold">5 live APIs</span>
        </div>

        <div className="py-0.5">
          {databaseExplorers.map((tool) => {
            const isActive = currentTab === tool.id;

            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => onSelectTab(tool.id)}
                className={`w-full text-left px-3 py-1.5 flex items-center justify-between border-b border-slate-200 last:border-b-0 cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-slate-300 font-semibold text-slate-900 border-l-4 border-l-slate-800'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className={isActive ? 'text-slate-900' : 'text-slate-500'}>
                    {tool.icon}
                  </span>
                  <span className="truncate">{tool.label}</span>
                </div>
                <span className="text-[9px] font-mono px-1 py-0.2 bg-slate-200 text-slate-600 border border-slate-300 shrink-0">
                  {tool.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Section 3: Reference Documentation */}
        <div className="bg-slate-200 border-t border-b border-slate-300 px-3 py-1.5 font-bold text-slate-800 text-[10px] uppercase tracking-wider flex items-center justify-between mt-1">
          <span>Documentation</span>
          <span className="text-[10px] text-slate-500 font-mono">Reference</span>
        </div>

        <div className="py-0.5">
          {documentationTools.map((tool) => {
            const isActive = currentTab === tool.id;

            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => onSelectTab(tool.id)}
                className={`w-full text-left px-3 py-1.5 flex items-center gap-2 border-b border-slate-200 last:border-b-0 cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-slate-300 font-semibold text-slate-900 border-l-4 border-l-slate-800'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className={isActive ? 'text-slate-900' : 'text-slate-500'}>
                  {tool.icon}
                </span>
                <span className="truncate">{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Sequence Inspector in Sidebar */}
      {hasSequence && (
        <div className="border-t border-slate-300 bg-white p-3 text-xs font-mono">
          <div className="font-sans font-bold text-slate-800 text-[10px] uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Loaded Sequence</span>
            <button
              type="button"
              onClick={onClear}
              className="text-[10px] text-rose-700 hover:underline font-sans cursor-pointer"
            >
              Unload
            </button>
          </div>

          <div className="space-y-1 text-[11px] text-slate-700">
            <div className="truncate font-sans font-medium text-slate-900" title={sequenceName}>
              {sequenceName}
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-1">
              <span className="text-slate-500">Length:</span>
              <span className="font-bold">{stats.totalLength} nt</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">GC Content:</span>
              <span className="font-bold">{stats.gcContent.standard}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">AT Content:</span>
              <span className="font-bold">{stats.atContent.standard}%</span>
            </div>
            {stats.ambiguousLength > 0 && (
              <div className="flex justify-between text-amber-800">
                <span>Ambiguous:</span>
                <span className="font-bold">{stats.ambiguousLength} nt</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Est. MW:</span>
              <span>~{stats.molecularWeightEstimatedDa.toLocaleString()} Da</span>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
