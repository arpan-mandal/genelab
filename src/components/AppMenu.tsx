import React, { useState, useEffect, useRef } from 'react';
import { PRESET_SEQUENCES, PresetSequence } from '../bio/presets';
import { NavTabId } from './ToolNavigation';

interface AppMenuProps {
  currentTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  onOpenFilePicker: () => void;
  onLoadPreset: (preset: PresetSequence) => void;
  onExportPDF: () => void;
  onExportTXT: () => void;
  onExportJSON: () => void;
  onPrint: () => void;
  onClear: () => void;
  onOpenCodonModal: () => void;
  onCopySequence: () => void;
  onCopyRevComp: () => void;
  onCopyProtein: () => void;
  colorCodingEnabled: boolean;
  onToggleColorCoding: () => void;
  showStatusBar: boolean;
  onToggleStatusBar: () => void;
  hasSequence: boolean;
}

export const AppMenu: React.FC<AppMenuProps> = ({
  onSelectTab,
  onOpenFilePicker,
  onLoadPreset,
  onExportPDF,
  onExportTXT,
  onExportJSON,
  onPrint,
  onClear,
  onOpenCodonModal,
  onCopySequence,
  onCopyRevComp,
  onCopyProtein,
  colorCodingEnabled,
  onToggleColorCoding,
  showStatusBar,
  onToggleStatusBar,
  hasSequence,
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleMenuClick = (menuName: string) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  const handleMouseEnter = (menuName: string) => {
    if (openMenu !== null) {
      setOpenMenu(menuName);
    }
  };

  const closeAndExecute = (action: () => void) => {
    setOpenMenu(null);
    action();
  };

  return (
    <div
      ref={menuBarRef}
      className="no-print bg-slate-200 border-b border-slate-300 px-2 py-0.5 flex items-center gap-0.5 text-xs text-slate-800 select-none relative z-50 font-sans"
    >
      <div className="font-bold text-slate-900 px-2 text-xs flex items-center gap-1 border-r border-slate-300 mr-1">
        <span>GeneLab</span>
        <span className="text-[10px] text-slate-500 font-normal">v1.2</span>
      </div>

      {/* FILE MENU */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleMenuClick('file')}
          onMouseEnter={() => handleMouseEnter('file')}
          className={`px-2.5 py-1 text-xs hover:bg-slate-300 cursor-pointer ${
            openMenu === 'file' ? 'bg-slate-300 font-semibold text-slate-900' : ''
          }`}
        >
          File
        </button>

        {openMenu === 'file' && (
          <div className="absolute top-full left-0 mt-0.5 w-60 bg-white border border-slate-400 shadow-md py-1 z-50 text-xs">
            <button
              type="button"
              onClick={() => closeAndExecute(onOpenFilePicker)}
              className="w-full text-left px-3 py-1 hover:bg-slate-100 flex justify-between"
            >
              <span>Open FASTA File...</span>
              <span className="text-slate-400 text-[11px]">Ctrl+O</span>
            </button>

            <div className="border-t border-slate-200 my-1"></div>

            <div className="px-3 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Load Example Sequence:
            </div>
            {PRESET_SEQUENCES.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => closeAndExecute(() => onLoadPreset(preset))}
                className="w-full text-left px-4 py-1 hover:bg-slate-100 text-[11px] truncate"
              >
                {preset.name}
              </button>
            ))}

            <div className="border-t border-slate-200 my-1"></div>

            <button
              type="button"
              disabled={!hasSequence}
              onClick={() => closeAndExecute(onExportTXT)}
              className="w-full text-left px-3 py-1 hover:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent"
            >
              Export Report as Text (.txt)...
            </button>
            <button
              type="button"
              disabled={!hasSequence}
              onClick={() => closeAndExecute(onExportJSON)}
              className="w-full text-left px-3 py-1 hover:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent"
            >
              Export Data as JSON (.json)...
            </button>
            <button
              type="button"
              disabled={!hasSequence}
              onClick={() => closeAndExecute(onExportPDF)}
              className="w-full text-left px-3 py-1 hover:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent"
            >
              Export Report as PDF (.pdf)...
            </button>

            <div className="border-t border-slate-200 my-1"></div>

            <button
              type="button"
              onClick={() => closeAndExecute(onPrint)}
              className="w-full text-left px-3 py-1 hover:bg-slate-100 flex justify-between"
            >
              <span>Print Document...</span>
              <span className="text-slate-400 text-[11px]">Ctrl+P</span>
            </button>

            <div className="border-t border-slate-200 my-1"></div>

            <button
              type="button"
              disabled={!hasSequence}
              onClick={() => closeAndExecute(onClear)}
              className="w-full text-left px-3 py-1 hover:bg-slate-100 text-rose-800 disabled:text-slate-300 disabled:hover:bg-transparent"
            >
              Clear Workspace
            </button>
          </div>
        )}
      </div>

      {/* EDIT MENU */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleMenuClick('edit')}
          onMouseEnter={() => handleMouseEnter('edit')}
          className={`px-2.5 py-1 text-xs hover:bg-slate-300 cursor-pointer ${
            openMenu === 'edit' ? 'bg-slate-300 font-semibold text-slate-900' : ''
          }`}
        >
          Edit
        </button>

        {openMenu === 'edit' && (
          <div className="absolute top-full left-0 mt-0.5 w-56 bg-white border border-slate-400 shadow-md py-1 z-50 text-xs">
            <button
              type="button"
              disabled={!hasSequence}
              onClick={() => closeAndExecute(onCopySequence)}
              className="w-full text-left px-3 py-1 hover:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent flex justify-between"
            >
              <span>Copy DNA Sequence</span>
              <span className="text-slate-400 text-[11px]">Ctrl+C</span>
            </button>
            <button
              type="button"
              disabled={!hasSequence}
              onClick={() => closeAndExecute(onCopyRevComp)}
              className="w-full text-left px-3 py-1 hover:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent"
            >
              Copy Reverse Complement
            </button>
            <button
              type="button"
              disabled={!hasSequence}
              onClick={() => closeAndExecute(onCopyProtein)}
              className="w-full text-left px-3 py-1 hover:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent"
            >
              Copy Translated Protein
            </button>
          </div>
        )}
      </div>

      {/* TOOLS MENU */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleMenuClick('tools')}
          onMouseEnter={() => handleMouseEnter('tools')}
          className={`px-2.5 py-1 text-xs hover:bg-slate-300 cursor-pointer ${
            openMenu === 'tools' ? 'bg-slate-300 font-semibold text-slate-900' : ''
          }`}
        >
          Tools
        </button>

        {openMenu === 'tools' && (
          <div className="absolute top-full left-0 mt-0.5 w-64 bg-white border border-slate-400 shadow-md py-1 z-50 text-xs">
            <button
              type="button"
              onClick={() => closeAndExecute(() => onSelectTab('analyzer'))}
              className="w-full text-left px-3 py-1 hover:bg-slate-100"
            >
              Sequence Analyzer
            </button>
            <button
              type="button"
              onClick={() => closeAndExecute(() => onSelectTab('translation'))}
              className="w-full text-left px-3 py-1 hover:bg-slate-100"
            >
              6-Frame Translation &amp; Reading Frames
            </button>
            <button
              type="button"
              onClick={() => closeAndExecute(() => onSelectTab('comparison'))}
              className="w-full text-left px-3 py-1 hover:bg-slate-100"
            >
              Pairwise Sequence Alignment (Needleman–Wunsch)
            </button>
            <button
              type="button"
              onClick={() => closeAndExecute(() => onSelectTab('orf'))}
              className="w-full text-left px-3 py-1 hover:bg-slate-100"
            >
              Open Reading Frame (ORF) Finder
            </button>

            <div className="border-t border-slate-200 my-1"></div>

            <button
              type="button"
              onClick={() => closeAndExecute(onOpenCodonModal)}
              className="w-full text-left px-3 py-1 hover:bg-slate-100"
            >
              Codon Translation Table (64 Codons)...
            </button>
          </div>
        )}
      </div>

      {/* DATABASES MENU */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleMenuClick('databases')}
          onMouseEnter={() => handleMouseEnter('databases')}
          className={`px-2.5 py-1 text-xs hover:bg-slate-300 cursor-pointer ${
            openMenu === 'databases' ? 'bg-slate-300 font-semibold text-slate-900' : ''
          }`}
        >
          Databases
        </button>

        {openMenu === 'databases' && (
          <div className="absolute top-full left-0 mt-0.5 w-68 bg-white border border-slate-400 shadow-md py-1 z-50 text-xs">
            <button
              type="button"
              onClick={() => closeAndExecute(() => onSelectTab('genes'))}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between"
            >
              <span>Gene &amp; Transcript Explorer</span>
              <span className="text-[10px] text-slate-400 font-mono">Ensembl / NCBI</span>
            </button>
            <button
              type="button"
              onClick={() => closeAndExecute(() => onSelectTab('proteins'))}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between"
            >
              <span>Protein &amp; 3D Structure Explorer</span>
              <span className="text-[10px] text-slate-400 font-mono">UniProt / RCSB</span>
            </button>
            <button
              type="button"
              onClick={() => closeAndExecute(() => onSelectTab('literature'))}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between"
            >
              <span>Scientific Literature Explorer</span>
              <span className="text-[10px] text-slate-400 font-mono">PubMed / PMC</span>
            </button>
            <button
              type="button"
              onClick={() => closeAndExecute(() => onSelectTab('compounds'))}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between"
            >
              <span>Chemical Compound Explorer</span>
              <span className="text-[10px] text-slate-400 font-mono">PubChem PUG</span>
            </button>
            <button
              type="button"
              onClick={() => closeAndExecute(() => onSelectTab('pathways'))}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between"
            >
              <span>Pathways &amp; Interaction Networks</span>
              <span className="text-[10px] text-slate-400 font-mono">STRING / Reactome</span>
            </button>
          </div>
        )}
      </div>

      {/* VIEW MENU */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleMenuClick('view')}
          onMouseEnter={() => handleMouseEnter('view')}
          className={`px-2.5 py-1 text-xs hover:bg-slate-300 cursor-pointer ${
            openMenu === 'view' ? 'bg-slate-300 font-semibold text-slate-900' : ''
          }`}
        >
          View
        </button>

        {openMenu === 'view' && (
          <div className="absolute top-full left-0 mt-0.5 w-56 bg-white border border-slate-400 shadow-md py-1 z-50 text-xs">
            <button
              type="button"
              onClick={() => closeAndExecute(onToggleColorCoding)}
              className="w-full text-left px-3 py-1 hover:bg-slate-100 flex items-center justify-between"
            >
              <span>Nucleotide Syntax Highlighting</span>
              <span>{colorCodingEnabled ? '✓' : ''}</span>
            </button>
            <button
              type="button"
              onClick={() => closeAndExecute(onToggleStatusBar)}
              className="w-full text-left px-3 py-1 hover:bg-slate-100 flex items-center justify-between"
            >
              <span>Application Status Bar</span>
              <span>{showStatusBar ? '✓' : ''}</span>
            </button>
          </div>
        )}
      </div>

      {/* HELP MENU */}
      <div className="relative">
        <button
          type="button"
          onClick={() => handleMenuClick('help')}
          onMouseEnter={() => handleMouseEnter('help')}
          className={`px-2.5 py-1 text-xs hover:bg-slate-300 cursor-pointer ${
            openMenu === 'help' ? 'bg-slate-300 font-semibold text-slate-900' : ''
          }`}
        >
          Help
        </button>

        {openMenu === 'help' && (
          <div className="absolute top-full left-0 mt-0.5 w-64 bg-white border border-slate-400 shadow-md py-1 z-50 text-xs">
            <button
              type="button"
              onClick={() => closeAndExecute(() => onSelectTab('learning'))}
              className="w-full text-left px-3 py-1 hover:bg-slate-100"
            >
              Bioinformatics Learning Center
            </button>
            <button
              type="button"
              onClick={() => closeAndExecute(() => onSelectTab('about'))}
              className="w-full text-left px-3 py-1 hover:bg-slate-100"
            >
              Algorithms &amp; Scientific Methodology
            </button>
            <button
              type="button"
              onClick={() => closeAndExecute(onOpenCodonModal)}
              className="w-full text-left px-3 py-1 hover:bg-slate-100"
            >
              Genetic Code Reference (NCBI Table 1)
            </button>

            <div className="border-t border-slate-200 my-1"></div>

            <button
              type="button"
              onClick={() => closeAndExecute(() => onSelectTab('about'))}
              className="w-full text-left px-3 py-1 hover:bg-slate-100 text-slate-600"
            >
              About GeneLab Platform...
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
