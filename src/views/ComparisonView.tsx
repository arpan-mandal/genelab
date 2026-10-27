import React, { useState } from 'react';
import {
  needlemanWunschAlign,
  validateAlignmentInputs,
  DEFAULT_ALIGNMENT_OPTIONS,
} from '../bio/alignment';
import { AlignmentOptions, AlignmentResult } from '../bio/types';
import { ALIGNMENT_PRESETS, AlignmentPreset } from '../bio/presets';
import { triggerFileDownload } from '../bio/export';
import { fetchNcbiFasta } from '../services/api/ncbi';

export const ComparisonView: React.FC = () => {
  const [seq1Input, setSeq1Input] = useState<string>(ALIGNMENT_PRESETS[0].seq1);
  const [seq2Input, setSeq2Input] = useState<string>(ALIGNMENT_PRESETS[0].seq2);
  const [seq1Name, setSeq1Name] = useState<string>(ALIGNMENT_PRESETS[0].seq1Name);
  const [seq2Name, setSeq2Name] = useState<string>(ALIGNMENT_PRESETS[0].seq2Name);

  const [options, setOptions] = useState<AlignmentOptions>(DEFAULT_ALIGNMENT_OPTIONS);
  const [copiedAlignment, setCopiedAlignment] = useState(false);
  const [loadingAcc, setLoadingAcc] = useState<'seq1' | 'seq2' | null>(null);

  const handleFetchFromNcbi = async (target: 'seq1' | 'seq2', acc: string) => {
    if (!acc.trim()) return;
    setLoadingAcc(target);
    try {
      const fasta = await fetchNcbiFasta(acc.trim());
      if (target === 'seq1') {
        setSeq1Input(fasta.sequence);
        setSeq1Name(`NCBI ${acc.trim()}`);
      } else {
        setSeq2Input(fasta.sequence);
        setSeq2Name(`NCBI ${acc.trim()}`);
      }
    } catch {
      alert(`Could not fetch sequence for accession "${acc}" from NCBI.`);
    } finally {
      setLoadingAcc(null);
    }
  };

  // Validate inputs
  const validation = validateAlignmentInputs(seq1Input, seq2Input);

  // Align if valid
  const alignmentResult: AlignmentResult | null = validation.canAlign
    ? needlemanWunschAlign(validation.cleanSeq1, validation.cleanSeq2, options)
    : null;

  const handleLoadPreset = (preset: AlignmentPreset) => {
    setSeq1Input(preset.seq1);
    setSeq2Input(preset.seq2);
    setSeq1Name(preset.seq1Name);
    setSeq2Name(preset.seq2Name);
  };

  const handleDownloadAlignment = () => {
    if (!alignmentResult) return;
    const divider = '='.repeat(76);
    let txt = `${divider}\n`;
    txt += `GENELAB — NEEDLEMAN-WUNSCH PAIRWISE GLOBAL ALIGNMENT REPORT\n`;
    txt += `Date: ${new Date().toISOString()}\n`;
    txt += `${divider}\n\n`;
    txt += `Sequence A:           ${seq1Name} (${validation.cleanSeq1.length} nt)\n`;
    txt += `Sequence B:           ${seq2Name} (${validation.cleanSeq2.length} nt)\n`;
    txt += `Scoring Parameters:   Match = +${options.matchScore}, Mismatch = ${options.mismatchPenalty}, Gap = ${options.gapPenalty}\n`;
    txt += `Alignment Length:     ${alignmentResult.alignmentLength} columns\n`;
    txt += `Alignment Score:      ${alignmentResult.score}\n`;
    txt += `Percentage Identity:  ${alignmentResult.identityPercentage}% (${alignmentResult.matches} / ${alignmentResult.alignmentLength} cols)\n`;
    txt += `Exact Matches:        ${alignmentResult.matches}\n`;
    txt += `Mismatches:           ${alignmentResult.mismatches}\n`;
    txt += `Total Gaps:           ${alignmentResult.gaps} (Seq A: ${alignmentResult.seq1Gaps}, Seq B: ${alignmentResult.seq2Gaps})\n`;
    txt += `Execution Time:       ${alignmentResult.executionTimeMs} ms\n\n`;
    txt += `ALIGNED SEQUENCES:\n\n`;
    txt += `Seq A: ${alignmentResult.seq1Aligned}\n`;
    txt += `       ${alignmentResult.matchLine}\n`;
    txt += `Seq B: ${alignmentResult.seq2Aligned}\n\n`;
    txt += `${divider}\n`;

    triggerFileDownload(txt, `Needleman_Wunsch_Alignment_${seq1Name.replace(/\s+/g, '_')}_vs_${seq2Name.replace(/\s+/g, '_')}.txt`);
  };

  const handleCopyAlignment = async () => {
    if (!alignmentResult) return;
    const alnText = `Seq A: ${alignmentResult.seq1Aligned}\n       ${alignmentResult.matchLine}\nSeq B: ${alignmentResult.seq2Aligned}`;
    try {
      await navigator.clipboard.writeText(alnText);
      setCopiedAlignment(true);
      setTimeout(() => setCopiedAlignment(false), 2000);
    } catch {
      setCopiedAlignment(false);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl">
      {/* 1. Header */}
      <div className="border-b border-slate-300 pb-2">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sequence Alignment (Needleman–Wunsch)</h1>
        <p className="text-xs text-slate-600 mt-0.5">
          End-to-end global dynamic programming alignment with configurable match, mismatch, and linear gap penalties.
        </p>
      </div>

      {/* Preset loader row */}
      <div className="bg-slate-100 border border-slate-300 p-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-bold text-slate-700 uppercase tracking-wide text-[11px]">
          Educational Mutation Presets:
        </span>
        <div className="flex items-center gap-1.5">
          {ALIGNMENT_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleLoadPreset(p)}
              className="btn-classic text-[11px]"
            >
              {p.name.split(':')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Sequence Editors (A and B) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sequence A */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5">
              <label className="font-bold text-slate-800">
                Sequence A:
              </label>
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  type="button"
                  disabled={loadingAcc === 'seq1'}
                  onClick={() => handleFetchFromNcbi('seq1', 'NM_000518.5')}
                  className="px-1 py-0.2 bg-slate-100 hover:bg-slate-200 border border-slate-300 font-mono text-[9px] cursor-pointer"
                  title="Fetch HBB (NM_000518.5) from NCBI"
                >
                  {loadingAcc === 'seq1' ? '...' : 'NCBI:HBB'}
                </button>
                <button
                  type="button"
                  disabled={loadingAcc === 'seq1'}
                  onClick={() => handleFetchFromNcbi('seq1', 'NM_000546.6')}
                  className="px-1 py-0.2 bg-slate-100 hover:bg-slate-200 border border-slate-300 font-mono text-[9px] cursor-pointer"
                  title="Fetch TP53 (NM_000546.6) from NCBI"
                >
                  TP53
                </button>
              </div>
            </div>
            <input
              type="text"
              value={seq1Name}
              onChange={(e) => setSeq1Name(e.target.value)}
              className="text-right text-xs text-slate-700 bg-transparent border-b border-slate-300 focus:border-slate-800 focus:outline-none px-1"
            />
          </div>
          <textarea
            rows={5}
            value={seq1Input}
            onChange={(e) => setSeq1Input(e.target.value)}
            placeholder="Paste Sequence A (reference)..."
            className="w-full p-2 bg-white border border-slate-400 font-mono text-xs text-slate-900 focus:outline-none focus:border-slate-800 rounded-none"
            spellCheck={false}
          />
          <div className="text-[11px] font-mono text-slate-500 text-right">
            Length: {validation.cleanSeq1.length} nt
          </div>
        </div>

        {/* Sequence B */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5">
              <label className="font-bold text-slate-800">
                Sequence B:
              </label>
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  type="button"
                  disabled={loadingAcc === 'seq2'}
                  onClick={() => handleFetchFromNcbi('seq2', 'NM_000519.4')}
                  className="px-1 py-0.2 bg-slate-100 hover:bg-slate-200 border border-slate-300 font-mono text-[9px] cursor-pointer"
                  title="Fetch HBD (NM_000519.4) from NCBI"
                >
                  {loadingAcc === 'seq2' ? '...' : 'NCBI:HBD'}
                </button>
                <button
                  type="button"
                  disabled={loadingAcc === 'seq2'}
                  onClick={() => handleFetchFromNcbi('seq2', 'NM_007294.4')}
                  className="px-1 py-0.2 bg-slate-100 hover:bg-slate-200 border border-slate-300 font-mono text-[9px] cursor-pointer"
                  title="Fetch BRCA1 (NM_007294.4) from NCBI"
                >
                  BRCA1
                </button>
              </div>
            </div>
            <input
              type="text"
              value={seq2Name}
              onChange={(e) => setSeq2Name(e.target.value)}
              className="text-right text-xs text-slate-700 bg-transparent border-b border-slate-300 focus:border-slate-800 focus:outline-none px-1"
            />
          </div>
          <textarea
            rows={5}
            value={seq2Input}
            onChange={(e) => setSeq2Input(e.target.value)}
            placeholder="Paste Sequence B (query/mutant)..."
            className="w-full p-2 bg-white border border-slate-400 font-mono text-xs text-slate-900 focus:outline-none focus:border-slate-800 rounded-none"
            spellCheck={false}
          />
          <div className="text-[11px] font-mono text-slate-500 text-right">
            Length: {validation.cleanSeq2.length} nt
          </div>
        </div>
      </div>

      {/* 3. Scoring Configuration Row */}
      <div className="border border-slate-300 bg-white p-3 space-y-2 text-xs">
        <div className="font-bold text-slate-800 uppercase tracking-wide text-[11px] border-b border-slate-200 pb-1 flex justify-between items-center">
          <span>Scoring Matrix Configuration</span>
          <span className="font-mono font-normal text-slate-500">Algorithm: O(N×M) Dynamic Programming</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-medium text-slate-700 mb-0.5">
              Match Reward (+):
            </label>
            <input
              type="number"
              value={options.matchScore}
              onChange={(e) => setOptions({ ...options, matchScore: parseInt(e.target.value) || 0 })}
              className="w-full bg-white border border-slate-400 px-2 py-1 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-700 mb-0.5">
              Mismatch Penalty (-):
            </label>
            <input
              type="number"
              value={options.mismatchPenalty}
              onChange={(e) => setOptions({ ...options, mismatchPenalty: parseInt(e.target.value) || 0 })}
              className="w-full bg-white border border-slate-400 px-2 py-1 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-700 mb-0.5">
              Linear Gap Penalty (-):
            </label>
            <input
              type="number"
              value={options.gapPenalty}
              onChange={(e) => setOptions({ ...options, gapPenalty: parseInt(e.target.value) || 0 })}
              className="w-full bg-white border border-slate-400 px-2 py-1 font-mono text-xs"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={() => {
                // Triggers alignment calculation
              }}
              className="btn-primary w-full py-1.5"
            >
              Align Sequences
            </button>
          </div>
        </div>
      </div>

      {/* Validation warning */}
      {!validation.canAlign && (seq1Input || seq2Input) && (
        <div className="p-2.5 bg-rose-50 border border-rose-300 text-xs text-rose-900 font-sans">
          <strong>Validation Error:</strong> {validation.error}
        </div>
      )}

      {/* 4. Results Section */}
      {alignmentResult && (
        <div className="space-y-5 pt-2">
          <hr className="border-t border-slate-300" />

          {/* Alignment Summary Table */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Alignment Summary
              </h2>
              <span className="text-[11px] font-mono text-slate-500">
                Execution time: {alignmentResult.executionTimeMs} ms
              </span>
            </div>

            <table className="table-dense">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                  <th>Calculation Formula / Denominator</th>
                  <th>Biological Interpretation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-sans font-medium text-slate-900">Percentage Identity</td>
                  <td><strong className="text-slate-900 text-sm">{alignmentResult.identityPercentage}%</strong></td>
                  <td className="font-mono text-slate-600">({alignmentResult.matches} matches / {alignmentResult.alignmentLength} total columns) × 100</td>
                  <td className="font-sans text-slate-600">Overall sequence conservation across the aligned region</td>
                </tr>
                <tr>
                  <td className="font-sans font-medium text-slate-900">Alignment Score</td>
                  <td><strong>{alignmentResult.score}</strong></td>
                  <td className="font-mono text-slate-600">Optimal dynamic programming traceback score</td>
                  <td className="font-sans text-slate-600">Global objective function maximum</td>
                </tr>
                <tr>
                  <td className="font-sans font-medium text-slate-900">Total Alignment Length</td>
                  <td>{alignmentResult.alignmentLength} columns</td>
                  <td className="font-mono text-slate-600">Matches + Mismatches + Total Gaps</td>
                  <td className="font-sans text-slate-600">Spanned alignment matrix columns</td>
                </tr>
                <tr>
                  <td className="font-sans font-medium text-slate-900">Exact Matches</td>
                  <td className="text-emerald-800 font-bold">{alignmentResult.matches} bases</td>
                  <td className="font-mono text-slate-600">{((alignmentResult.matches / alignmentResult.alignmentLength) * 100).toFixed(1)}% of columns</td>
                  <td className="font-sans text-slate-600">Identical nucleotide positions in both sequences</td>
                </tr>
                <tr>
                  <td className="font-sans font-medium text-slate-900">Mismatches</td>
                  <td className="text-rose-800 font-bold">{alignmentResult.mismatches} bases</td>
                  <td className="font-mono text-slate-600">{((alignmentResult.mismatches / alignmentResult.alignmentLength) * 100).toFixed(1)}% of columns</td>
                  <td className="font-sans text-slate-600">Substitutions (SNPs: transitions and transversions)</td>
                </tr>
                <tr>
                  <td className="font-sans font-medium text-slate-900">Inserted Gaps (Indels)</td>
                  <td className="font-bold text-slate-900">{alignmentResult.gaps} gaps</td>
                  <td className="font-mono text-slate-600">Seq A: {alignmentResult.seq1Gaps} | Seq B: {alignmentResult.seq2Gaps}</td>
                  <td className="font-sans text-slate-600">Insertions or deletions requiring alignment shift</td>
                </tr>
              </tbody>
            </table>
          </div>

          <hr className="border-t border-slate-300" />

          {/* Monospaced Alignment Viewer */}
          <div>
            <div className="flex justify-between items-center mb-2 text-xs">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Pairwise Alignment Display
              </h2>
              <div className="flex items-center gap-2">
                {copiedAlignment && (
                  <span className="text-[11px] font-mono text-emerald-800 font-semibold">
                    ✓ Copied alignment
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleCopyAlignment}
                  className="btn-classic text-[11px]"
                >
                  Copy Alignment
                </button>
                <button
                  type="button"
                  onClick={handleDownloadAlignment}
                  className="btn-classic text-[11px]"
                >
                  Download .TXT
                </button>
              </div>
            </div>

            {/* Formatted aligned rows */}
            <div className="border border-slate-400 bg-white p-4 font-mono text-xs overflow-x-auto select-all leading-snug">
              {(() => {
                const chunks = [];
                const len = alignmentResult.alignmentLength;
                const chunkSize = 60;
                let pos1 = 1;
                let pos2 = 1;

                for (let start = 0; start < len; start += chunkSize) {
                  const end = Math.min(start + chunkSize, len);
                  const sub1 = alignmentResult.seq1Aligned.substring(start, end);
                  const subM = alignmentResult.matchLine.substring(start, end);
                  const sub2 = alignmentResult.seq2Aligned.substring(start, end);

                  const basesIn1 = sub1.replace(/-/g, '').length;
                  const basesIn2 = sub2.replace(/-/g, '').length;

                  const start1 = pos1;
                  const end1 = pos1 + basesIn1 - 1;
                  const start2 = pos2;
                  const end2 = pos2 + basesIn2 - 1;

                  chunks.push(
                    <div key={start} className="mb-3 last:mb-0">
                      {/* Seq A row */}
                      <div className="flex items-center gap-2">
                        <span className="w-16 text-slate-600 font-bold select-none text-[11px]">
                          Seq A:
                        </span>
                        <span className="w-10 text-right text-slate-400 select-none text-[11px]">
                          {start1}
                        </span>
                        <span className="tracking-widest text-slate-900 font-bold">
                          {sub1}
                        </span>
                        <span className="w-10 text-slate-400 select-none text-[11px]">
                          {end1}
                        </span>
                      </div>

                      {/* Match indicator row */}
                      <div className="flex items-center gap-2 select-none">
                        <span className="w-16"></span>
                        <span className="w-10"></span>
                        <span className="tracking-widest text-slate-700 font-bold">
                          {subM}
                        </span>
                      </div>

                      {/* Seq B row */}
                      <div className="flex items-center gap-2">
                        <span className="w-16 text-slate-600 font-bold select-none text-[11px]">
                          Seq B:
                        </span>
                        <span className="w-10 text-right text-slate-400 select-none text-[11px]">
                          {start2}
                        </span>
                        <span className="tracking-widest text-slate-900 font-bold">
                          {sub2}
                        </span>
                        <span className="w-10 text-slate-400 select-none text-[11px]">
                          {end2}
                        </span>
                      </div>
                    </div>
                  );

                  pos1 += basesIn1;
                  pos2 += basesIn2;
                }

                return chunks;
              })()}
            </div>

            {/* Alignment symbol legend */}
            <div className="mt-2 text-[11px] font-mono text-slate-600 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-1.5">
              <div className="flex items-center gap-4">
                <span><strong>|</strong> = Exact Match</span>
                <span><strong>:</strong> = Transition (A↔G, C↔T)</span>
                <span><strong>.</strong> = Transversion</span>
                <span><strong>-</strong> = Indel Gap</span>
              </div>
              <span>Needleman–Wunsch Global Traceback</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
