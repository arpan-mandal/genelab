import React, { useState } from 'react';
import { ReadingFrameId, ReadingFrameResult } from '../bio/types';
import { translateReadingFrame, translateAllSixFrames } from '../bio/translation';
import { CodonTableModal } from '../components/CodonTableModal';
import { PRESET_SEQUENCES, PresetSequence } from '../bio/presets';

interface TranslationViewProps {
  sequence: string;
  onLoadPreset: (preset: PresetSequence) => void;
  onNavigate?: (tab: any, query?: string) => void;
}

export const TranslationView: React.FC<TranslationViewProps> = ({
  sequence,
  onLoadPreset,
  onNavigate,
}) => {
  const [selectedFrame, setSelectedFrame] = useState<ReadingFrameId>('+1');
  const [notation, setNotation] = useState<'one' | 'three'>('one');
  const [showCodonModal, setShowCodonModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'sixframe'>('single');

  const hasSeq = sequence && sequence.length >= 3;

  const frameResult: ReadingFrameResult | null = hasSeq
    ? translateReadingFrame(sequence, selectedFrame)
    : null;

  const allSix = hasSeq ? translateAllSixFrames(sequence) : null;

  const handleCopyProtein = async () => {
    if (!frameResult) return;
    const text =
      notation === 'one'
        ? frameResult.aminoAcidSequenceOne
        : frameResult.aminoAcidSequenceThree;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl">
      {/* 1. Header */}
      <div className="border-b border-slate-300 pb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Translation & Reading Frames</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Technical in silico codon translation across forward (+1, +2, +3) and reverse (-1, -2, -3) reading frames.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCodonModal(true)}
          className="btn-classic text-xs"
        >
          View 64-Codon Lookup Table...
        </button>
      </div>

      {/* 2. Compact Input and Settings Area */}
      <div className="border border-slate-300 bg-white p-3 space-y-3">
        <div className="font-bold text-xs uppercase tracking-wide text-slate-800 border-b border-slate-200 pb-1.5 flex justify-between items-center">
          <span>Translation Parameters</span>
          <span className="font-mono font-normal text-slate-500">
            {hasSeq ? `${sequence.length} nt input` : 'No sequence'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Reading frame selector */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Reading Frame:</label>
            <select
              value={selectedFrame}
              onChange={(e) => setSelectedFrame(e.target.value as ReadingFrameId)}
              className="w-full bg-white border border-slate-400 p-1 text-xs font-mono"
            >
              <option value="+1">+1 (Forward strand, offset 0)</option>
              <option value="+2">+2 (Forward strand, offset 1)</option>
              <option value="+3">+3 (Forward strand, offset 2)</option>
              <option value="-1">-1 (Reverse complement, offset 0)</option>
              <option value="-2">-2 (Reverse complement, offset 1)</option>
              <option value="-3">-3 (Reverse complement, offset 2)</option>
            </select>
          </div>

          {/* Genetic code selector */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Genetic Code:</label>
            <select
              defaultValue="1"
              className="w-full bg-white border border-slate-400 p-1 text-xs"
            >
              <option value="1">NCBI Table 1: Standard (Universal)</option>
            </select>
          </div>

          {/* Notation selector */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Notation:</label>
            <select
              value={notation}
              onChange={(e) => setNotation(e.target.value as any)}
              className="w-full bg-white border border-slate-400 p-1 text-xs font-mono"
            >
              <option value="one">Single-Letter Code (e.g. M-A-F)</option>
              <option value="three">Three-Letter Code (e.g. Met-Ala-Phe)</option>
            </select>
          </div>

          {/* View mode */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Display Mode:</label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode('single')}
                className={`btn-classic flex-1 ${viewMode === 'single' ? 'bg-slate-300 font-bold border-slate-500' : ''}`}
              >
                Active Frame
              </button>
              <button
                type="button"
                onClick={() => setViewMode('sixframe')}
                className={`btn-classic flex-1 ${viewMode === 'sixframe' ? 'bg-slate-300 font-bold border-slate-500' : ''}`}
              >
                6-Frame Matrix
              </button>
            </div>
          </div>
        </div>

        {!hasSeq && (
          <div className="p-2 bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-center justify-between">
            <span>No DNA sequence loaded for translation. Load the Beta-Globin wild-type sample sequence to begin:</span>
            <button
              type="button"
              onClick={() => onLoadPreset(PRESET_SEQUENCES[0])}
              className="btn-classic text-[11px]"
            >
              Load HBB (Wild-Type)
            </button>
          </div>
        )}
      </div>

      {/* 3. Output when sequence is loaded */}
      {hasSeq && frameResult && (
        <div className="space-y-5">
          {/* Active Frame Summary Table */}
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-wide">
              Translation Summary ({frameResult.frameId})
            </h2>

            <table className="table-dense">
              <thead>
                <tr>
                  <th>Selected Frame</th>
                  <th>Strand Polarity</th>
                  <th>Frame Offset</th>
                  <th className="text-right">Codon Count</th>
                  <th className="text-right">Start Codons (ATG)</th>
                  <th className="text-right">Stop Codons (*)</th>
                  <th>Trailing Bases</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-bold text-slate-900">{frameResult.frameId}</td>
                  <td className="font-sans text-slate-700 capitalize">{frameResult.strand}</td>
                  <td>{frameResult.offset} nucleotide(s)</td>
                  <td className="text-right font-bold text-slate-900">{frameResult.totalCodons}</td>
                  <td className="text-right font-bold text-emerald-800">{frameResult.startCodonCount}</td>
                  <td className="text-right font-bold text-rose-800">{frameResult.stopCodonCount}</td>
                  <td>
                    {frameResult.hasIncompleteCodon ? (
                      <span className="font-bold text-amber-800">
                        {frameResult.trailingBases} ({frameResult.trailingBases.length} nt incomplete)
                      </span>
                    ) : (
                      <span className="text-slate-500 font-sans">0 (Complete frame)</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Six-Frame Aligned Sequence View */}
          {viewMode === 'sixframe' && allSix && (
            <div>
              <h2 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-wide">
                Six-Frame Aligned Sequence Table
              </h2>
              <div className="border border-slate-300 bg-white p-3 font-mono text-xs overflow-x-auto space-y-2">
                {(['+1', '+2', '+3', '-1', '-2', '-3'] as ReadingFrameId[]).map((fId) => {
                  const fr = allSix[fId];
                  const isCur = selectedFrame === fId;
                  return (
                    <div
                      key={fId}
                      className={`p-1.5 border border-slate-200 flex items-start gap-3 ${
                        isCur ? 'bg-blue-50 border-blue-400 font-semibold text-blue-950' : 'bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="w-24 shrink-0 font-bold flex justify-between">
                        <span>Frame {fId}</span>
                        <span className="text-slate-500 text-[10px] font-normal font-sans uppercase">
                          {fr.strand.substring(0, 3)}
                        </span>
                      </div>
                      <div className="tracking-widest select-all break-all flex-1 text-slate-900">
                        {notation === 'one' ? fr.aminoAcidSequenceOne : fr.aminoAcidSequenceThree}
                      </div>
                      <div className="w-28 shrink-0 text-right text-[11px] text-slate-500 font-sans">
                        {fr.totalCodons} codons ({fr.startCodonCount} ATG, {fr.stopCodonCount} stop)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Translated Peptide Output Box */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-bold text-slate-800 uppercase tracking-wide text-xs">
                Translated Peptide Sequence ({frameResult.frameId}):
              </span>
              <div className="flex items-center gap-2">
                {copied && (
                  <span className="text-[11px] font-mono text-emerald-800 font-semibold">
                    ✓ Copied peptide
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleCopyProtein}
                  className="btn-classic text-[11px]"
                >
                  Copy Protein Sequence
                </button>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('proteins', 'HBB')}
                    className="btn-classic text-[11px] bg-slate-100 hover:bg-slate-200"
                    title="Cross-reference protein in UniProt & RCSB PDB"
                  >
                    UniProt &amp; PDB →
                  </button>
                )}
              </div>
            </div>

            <div className="p-2.5 bg-white border border-slate-400 font-mono text-xs text-slate-900 break-all select-all max-h-36 overflow-y-auto leading-relaxed">
              {notation === 'one'
                ? frameResult.aminoAcidSequenceOne
                : frameResult.aminoAcidSequenceThree}
            </div>

            {frameResult.hasIncompleteCodon && (
              <div className="mt-1.5 p-2 bg-slate-100 border border-slate-300 text-xs font-sans text-slate-700">
                <strong>Incomplete trailing codon notice:</strong> Trailing sequence <code>{frameResult.trailingBases}</code> ({frameResult.trailingBases.length} nt) at the 3' terminus does not form a full triplet codon and is displayed separately rather than discarded.
              </div>
            )}
          </div>

          <hr className="border-t border-slate-300" />

          {/* Codon-by-Codon Mapping Table */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Codon Mapping Table
              </h2>
              <span className="text-xs font-mono text-slate-600">
                Total codons: {frameResult.codons.length}
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto border border-slate-300 bg-white">
              <table className="table-dense">
                <thead className="sticky top-0 bg-slate-100 z-10">
                  <tr>
                    <th className="w-16">Position</th>
                    <th className="w-24">Genomic Range</th>
                    <th className="w-20">Codon</th>
                    <th className="w-16">AA (1L)</th>
                    <th className="w-20">AA (3L)</th>
                    <th>Full Name</th>
                    <th>Chemical Property</th>
                    <th>Signal / Status</th>
                  </tr>
                </thead>
                <tbody>
                  {frameResult.codons.map((c, idx) => (
                    <tr
                      key={idx}
                      className={
                        c.isStart
                          ? 'bg-emerald-50/70 font-bold'
                          : c.isStop
                          ? 'bg-rose-50/70 font-bold'
                          : c.isIncomplete
                          ? 'bg-amber-50/70'
                          : ''
                      }
                    >
                      <td className="text-slate-600">#{idx + 1}</td>
                      <td className="text-slate-600">{c.genomicStart} .. {c.genomicEnd}</td>
                      <td className="font-bold text-slate-900 tracking-wider">{c.codon}</td>
                      <td className={c.isStart ? 'text-emerald-800 font-bold' : c.isStop ? 'text-rose-800 font-bold' : ''}>
                        {c.aminoAcidOne}
                      </td>
                      <td className={c.isStart ? 'text-emerald-800' : c.isStop ? 'text-rose-800' : ''}>
                        {c.aminoAcidThree}
                      </td>
                      <td className="font-sans text-slate-800">{c.aminoAcidName}</td>
                      <td className="font-sans text-slate-600 capitalize">{c.property}</td>
                      <td className="font-sans">
                        {c.isStart ? (
                          <span className="text-emerald-800 font-bold">START (Methionine)</span>
                        ) : c.isStop ? (
                          <span className="text-rose-800 font-bold">STOP SIGNAL (*)</span>
                        ) : c.isIncomplete ? (
                          <span className="text-amber-800 font-bold">Incomplete ({c.codon.length} nt)</span>
                        ) : c.isAmbiguous ? (
                          <span className="text-purple-800 font-bold">Ambiguous codon</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-2 text-[11px] text-slate-500 font-sans leading-relaxed">
              * Note: In silico translation reflects potential amino acid output according to the standard genetic code. Biological gene expression requires transcriptional promoter activity, Kozak/Shine-Dalgarno consensus sequences, and in vivo cellular translation.
            </div>
          </div>
        </div>
      )}

      {/* Codon Modal */}
      <CodonTableModal
        isOpen={showCodonModal}
        onClose={() => setShowCodonModal(false)}
      />
    </div>
  );
};
