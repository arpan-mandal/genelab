import React, { useState } from 'react';
import { findOpenReadingFrames } from '../bio/orf';
import { ORFItem } from '../bio/types';
import { PRESET_SEQUENCES, PresetSequence } from '../bio/presets';

interface OrfViewProps {
  sequence: string;
  onLoadPreset: (preset: PresetSequence) => void;
  onNavigate?: (tab: any, query?: string) => void;
}

export const OrfView: React.FC<OrfViewProps> = ({
  sequence,
  onLoadPreset,
  onNavigate,
}) => {
  const [minCodons, setMinCodons] = useState<number>(20);
  const [selectedOrf, setSelectedOrf] = useState<ORFItem | null>(null);
  const [copiedProt, setCopiedProt] = useState(false);
  const [copiedNt, setCopiedNt] = useState(false);

  const hasSeq = sequence && sequence.length >= 30;

  const orfs: ORFItem[] = hasSeq
    ? findOpenReadingFrames(sequence, {
        minCodonLength: minCodons,
        requireStartCodon: true,
        allowAlternativeStarts: false,
      })
    : [];

  const handleCopyProtein = async (prot: string) => {
    try {
      await navigator.clipboard.writeText(prot);
      setCopiedProt(true);
      setTimeout(() => setCopiedProt(false), 2000);
    } catch {
      setCopiedProt(false);
    }
  };

  const handleCopyNt = async (nt: string) => {
    try {
      await navigator.clipboard.writeText(nt);
      setCopiedNt(true);
      setTimeout(() => setCopiedNt(false), 2000);
    } catch {
      setCopiedNt(false);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl">
      {/* 1. Header */}
      <div className="border-b border-slate-300 pb-2">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Open Reading Frame (ORF) Finder</h1>
        <p className="text-xs text-slate-600 mt-0.5">
          Discovery of candidate protein-coding segments beginning with an initiation codon (ATG) and ending at an in-frame stop codon.
        </p>
      </div>

      {/* 2. Controls & Filter Bar */}
      <div className="border border-slate-300 bg-white p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <label className="font-bold text-slate-800">
            Minimum Codon Length:
          </label>
          <div className="flex items-center gap-1.5 font-mono">
            <input
              type="number"
              min={5}
              max={200}
              step={5}
              value={minCodons}
              onChange={(e) => setMinCodons(parseInt(e.target.value) || 10)}
              className="w-20 bg-white border border-slate-400 px-2 py-1 text-xs"
            />
            <span className="text-slate-500">codons ({minCodons * 3} nt)</span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-600 flex items-center gap-3">
          <span>Start: <strong>ATG</strong></span>
          <span>Stops: <strong>TAA, TAG, TGA</strong></span>
          <span>Frames: <strong>+1..+3, -1..-3</strong></span>
        </div>
      </div>

      {!hasSeq && (
        <div className="p-3 bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-center justify-between">
          <span>No sequence loaded for ORF finding. Load the Beta-Globin wild-type sample sequence to begin:</span>
          <button
            type="button"
            onClick={() => onLoadPreset(PRESET_SEQUENCES[0])}
            className="btn-classic text-[11px]"
          >
            Load HBB (Wild-Type)
          </button>
        </div>
      )}

      {/* 3. Discovered ORFs Table */}
      {hasSeq && (
        <div className="space-y-5">
          <div>
            <div className="flex justify-between items-center mb-2 text-xs">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Identified Open Reading Frames
              </h2>
              <span className="font-mono text-slate-600">
                Found: {orfs.length} candidate ORF(s) ≥ {minCodons} codons
              </span>
            </div>

            {orfs.length === 0 ? (
              <div className="border border-slate-300 bg-white p-6 text-center text-xs text-slate-500 font-mono">
                No Open Reading Frames found exceeding the minimum threshold ({minCodons} codons). Try decreasing the minimum length threshold.
              </div>
            ) : (
              <table className="table-dense">
                <thead>
                  <tr>
                    <th>ORF ID</th>
                    <th>Frame</th>
                    <th>Strand</th>
                    <th className="text-right">Genomic Start</th>
                    <th className="text-right">Genomic Stop</th>
                    <th className="text-right">Length (nt)</th>
                    <th className="text-right">Protein (aa)</th>
                    <th>Signals</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orfs.map((orf) => {
                    const isSelected = selectedOrf?.id === orf.id;
                    return (
                      <tr
                        key={orf.id}
                        className={isSelected ? 'bg-blue-100 font-semibold' : ''}
                      >
                        <td className="font-sans font-medium text-slate-900">{orf.id}</td>
                        <td className="font-bold text-slate-800">{orf.frame}</td>
                        <td className="font-sans text-slate-600">
                          {orf.strand === '+' ? 'Forward (+)' : 'Reverse (-)'}
                        </td>
                        <td className="text-right">{orf.startPos}</td>
                        <td className="text-right">{orf.endPos}</td>
                        <td className="text-right">{orf.nucleotideLength}</td>
                        <td className="text-right font-bold text-slate-900">{orf.proteinLength}</td>
                        <td className="text-[11px]">
                          <span className="text-emerald-800 font-bold">{orf.startCodon}</span> → <span className="text-rose-800 font-bold">{orf.stopCodon}</span>
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedOrf(orf)}
                            className="btn-classic text-[11px] py-0.5 px-2"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* 4. Selected ORF Inspector */}
          {selectedOrf && (
            <div className="border border-slate-400 bg-white p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    ORF Details: {selectedOrf.id}
                  </h3>
                  <div className="text-[11px] font-mono text-slate-600 mt-0.5">
                    Frame: {selectedOrf.frame} | Strand: {selectedOrf.strand} | Coordinates: {selectedOrf.startPos}..{selectedOrf.endPos} | Length: {selectedOrf.nucleotideLength} nt ({selectedOrf.proteinLength} aa)
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyProtein(selectedOrf.proteinSequence)}
                    className="btn-classic text-[11px]"
                  >
                    {copiedProt ? '✓ Copied Protein' : 'Copy Protein Sequence'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyNt(selectedOrf.nucleotideSequence)}
                    className="btn-classic text-[11px]"
                  >
                    {copiedNt ? '✓ Copied DNA' : 'Copy Coding DNA'}
                  </button>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate('proteins', 'HBB')}
                      className="btn-classic text-[11px] bg-slate-100 hover:bg-slate-200"
                      title="Cross-reference candidate protein in UniProt & RCSB PDB"
                    >
                      UniProt &amp; PDB →
                    </button>
                  )}
                </div>
              </div>

              {/* Protein sequence */}
              <div className="space-y-1">
                <span className="font-bold text-slate-800 text-xs block">
                  Translated Peptide Sequence ({selectedOrf.proteinLength} aa):
                </span>
                <div className="p-2 bg-slate-50 border border-slate-300 font-mono text-xs text-slate-900 break-all select-all max-h-28 overflow-y-auto leading-relaxed">
                  {selectedOrf.proteinSequence}
                </div>
              </div>

              {/* Coding DNA sequence */}
              <div className="space-y-1">
                <span className="font-bold text-slate-800 text-xs block">
                  Coding Nucleotide Sequence ({selectedOrf.nucleotideLength} nt):
                </span>
                <div className="p-2 bg-slate-50 border border-slate-300 font-mono text-xs text-slate-900 break-all select-all max-h-28 overflow-y-auto leading-relaxed">
                  {selectedOrf.nucleotideSequence}
                </div>
              </div>
            </div>
          )}

          <div className="p-2.5 bg-slate-100 border border-slate-300 text-[11px] text-slate-600 font-sans leading-relaxed">
            <strong>Biological Limitation Notice:</strong> An in silico Open Reading Frame represents a candidate coding sequence uninterrupted by stop codons. In vivo verification requires biological evidence such as promoter mapping, transcriptional expression, and mass-spectrometry protein identification.
          </div>
        </div>
      )}
    </div>
  );
};
