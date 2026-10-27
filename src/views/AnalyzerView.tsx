import React, { useState, useRef } from 'react';
import { Search, RefreshCw, Database } from 'lucide-react';
import {
  validateAndCleanSequence,
  calculateNucleotideStats,
  getAllTransformations,
  calculateGCProfile,
} from '../bio/nucleotide';
import { PRESET_SEQUENCES, PresetSequence } from '../bio/presets';
import { generatePlainTextReport, triggerFileDownload } from '../bio/export';
import { searchNcbi, fetchNcbiFasta } from '../services/api/ncbi';
import { SourceBadge } from '../components/research/SourceBadge';

interface AnalyzerViewProps {
  rawSequence: string;
  setRawSequence: (seq: string) => void;
  sequenceName: string;
  setSequenceName: (name: string) => void;
}

export const AnalyzerView: React.FC<AnalyzerViewProps> = ({
  rawSequence,
  setRawSequence,
  sequenceName,
  setSequenceName,
}) => {
  const [activeTransform, setActiveTransform] = useState<'revcomp' | 'comp' | 'rev' | 'rna'>('revcomp');
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);
  const [syntaxColoring, setSyntaxColoring] = useState<boolean>(true);
  const [chunkMode, setChunkMode] = useState<'decamer' | 'continuous' | 'triplet'>('decamer');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // NCBI Direct Fetcher State
  const [ncbiQuery, setNcbiQuery] = useState('');
  const [ncbiLoading, setNcbiLoading] = useState(false);
  const [ncbiError, setNcbiError] = useState<string | null>(null);

  const handleFetchNcbi = async (accOrTerm: string) => {
    if (!accOrTerm.trim()) return;
    setNcbiLoading(true);
    setNcbiError(null);
    const term = accOrTerm.trim();
    try {
      let fastaText = '';
      if (/^[A-Z]{1,2}_?[0-9]+(\.[0-9]+)?$/i.test(term) || /^[A-Z0-9]+(\.[0-9]+)?$/i.test(term)) {
        try {
          const res = await fetchNcbiFasta(term);
          fastaText = res.rawFasta;
        } catch {
          // Fallback to search
        }
      }

      if (!fastaText) {
        const searchRes = await searchNcbi('nuccore', term, 1);
        if (searchRes.idList.length > 0) {
          const res = await fetchNcbiFasta(searchRes.idList[0]);
          fastaText = res.rawFasta;
          setSequenceName(res.header.slice(0, 45) || `NCBI ${searchRes.idList[0]}`);
        } else {
          throw new Error(`No nucleotide records found for "${term}" in NCBI.`);
        }
      } else {
        setSequenceName(`NCBI ${term}`);
      }

      setRawSequence(fastaText);
    } catch (err: any) {
      setNcbiError(err.message || 'Failed to fetch sequence from NCBI.');
    } finally {
      setNcbiLoading(false);
    }
  };

  // Validation
  const validation = validateAndCleanSequence(rawSequence);
  const isSeqValid = validation.isValid && validation.cleanedSequence.length > 0;
  const activeSequence = validation.cleanedSequence;

  const stats = calculateNucleotideStats(activeSequence);
  const transformations = isSeqValid ? getAllTransformations(activeSequence) : null;
  const gcProfile = isSeqValid ? calculateGCProfile(activeSequence, 30, 5) : [];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawSequence(content);
        setSequenceName(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLoadSample = (sample: PresetSequence) => {
    setRawSequence(sample.sequence);
    setSequenceName(sample.name);
  };

  const handleClear = () => {
    setRawSequence('');
    setSequenceName('');
  };

  const handleCopyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedNotice(label);
      setTimeout(() => setCopiedNotice(null), 2000);
    } catch {
      setCopiedNotice(null);
    }
  };

  const handleDownloadTxt = () => {
    if (!isSeqValid) return;
    const report = generatePlainTextReport({
      title: 'GeneLab DNA Sequence Analysis',
      sequenceName: sequenceName || validation.fastaHeader || 'Sequence Analysis',
      rawSequence: activeSequence,
      stats,
      transformations: transformations || undefined,
    });
    triggerFileDownload(report, `${(sequenceName || 'GeneLab_Analysis').replace(/\s+/g, '_')}_Report.txt`);
  };

  // Format sequence with line numbers (60 bases per row)
  const formatSequenceRows = (seq: string) => {
    const rows = [];
    const rowLen = 60;
    const chunkSize = chunkMode === 'decamer' ? 10 : chunkMode === 'triplet' ? 3 : 60;

    for (let i = 0; i < seq.length; i += rowLen) {
      const lineSlice = seq.substring(i, i + rowLen);
      const chunks = [];
      for (let c = 0; c < lineSlice.length; c += chunkSize) {
        chunks.push(lineSlice.substring(c, c + chunkSize));
      }
      rows.push({
        start: i + 1,
        end: Math.min(i + rowLen, seq.length),
        chunks,
      });
    }
    return rows;
  };

  const getBaseColorStyle = (base: string): string => {
    if (!syntaxColoring) return 'text-slate-900';
    switch (base.toUpperCase()) {
      case 'A': return 'text-emerald-800 font-bold';
      case 'T': return 'text-rose-800 font-bold';
      case 'G': return 'text-amber-800 font-bold';
      case 'C': return 'text-sky-800 font-bold';
      case 'U': return 'text-purple-800 font-bold';
      default: return 'text-indigo-800 font-bold';
    }
  };

  return (
    <div className="space-y-5 max-w-5xl">
      {/* 1. Tool Header */}
      <div className="border-b border-slate-300 pb-2">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sequence Analyzer</h1>
        <p className="text-xs text-slate-600 mt-0.5">
          Validation, nucleotide frequencies, ambiguity handling, GC/AT ratios, and strand transformations.
        </p>
      </div>

      {/* 2. Sequence Input Section */}
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <label htmlFor="dna-sequence-input" className="font-bold text-slate-800">
            DNA sequence
          </label>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".fasta,.fa,.fna,.txt"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-classic text-[11px]"
            >
              Import FASTA File...
            </button>
            <button
              type="button"
              onClick={() => handleLoadSample(PRESET_SEQUENCES[0])}
              className="btn-classic text-[11px]"
            >
              Load Example (HBB Wild-Type)
            </button>
            <button
              type="button"
              onClick={() => handleLoadSample(PRESET_SEQUENCES[4])}
              className="btn-classic text-[11px]"
            >
              Load Degenerate (IUPAC)
            </button>
            <button
              type="button"
              disabled={!rawSequence}
              onClick={handleClear}
              className="btn-classic text-[11px] text-rose-800"
            >
              Clear
            </button>
          </div>
        </div>

        {/* NCBI RefSeq & Database Direct Fetcher Toolbar */}
        <div className="bg-slate-50 border border-slate-300 p-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1 shrink-0">
              <Database className="w-3.5 h-3.5 text-slate-700" />
              NCBI Fetcher:
            </span>
            <input
              type="text"
              value={ncbiQuery}
              onChange={(e) => setNcbiQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleFetchNcbi(ncbiQuery);
                }
              }}
              placeholder="RefSeq Accession or Symbol (e.g. NM_000518.5, NM_000546.6, BRCA1)..."
              className="flex-1 bg-white border border-slate-300 px-2 py-1 text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-800"
            />
            <button
              type="button"
              disabled={ncbiLoading || !ncbiQuery.trim()}
              onClick={() => handleFetchNcbi(ncbiQuery)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white font-medium text-xs flex items-center gap-1 cursor-pointer transition-colors shrink-0"
            >
              {ncbiLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
              <span>Retrieve FASTA</span>
            </button>
          </div>

          <div className="flex items-center gap-1 text-[10px] flex-wrap">
            <span className="text-slate-500 font-medium">RefSeq:</span>
            <button
              type="button"
              onClick={() => {
                setNcbiQuery('NM_000518.5');
                handleFetchNcbi('NM_000518.5');
              }}
              className="px-1.5 py-0.5 bg-white border border-slate-300 hover:bg-slate-100 font-mono cursor-pointer"
            >
              HBB
            </button>
            <button
              type="button"
              onClick={() => {
                setNcbiQuery('NM_000546.6');
                handleFetchNcbi('NM_000546.6');
              }}
              className="px-1.5 py-0.5 bg-white border border-slate-300 hover:bg-slate-100 font-mono cursor-pointer"
            >
              TP53
            </button>
            <button
              type="button"
              onClick={() => {
                setNcbiQuery('NM_007294.4');
                handleFetchNcbi('NM_007294.4');
              }}
              className="px-1.5 py-0.5 bg-white border border-slate-300 hover:bg-slate-100 font-mono cursor-pointer"
            >
              BRCA1
            </button>
            <button
              type="button"
              onClick={() => {
                setNcbiQuery('NM_000207.3');
                handleFetchNcbi('NM_000207.3');
              }}
              className="px-1.5 py-0.5 bg-white border border-slate-300 hover:bg-slate-100 font-mono cursor-pointer"
            >
              INS
            </button>
            <SourceBadge source="NCBI" />
          </div>
        </div>

        {ncbiError && (
          <div className="p-2 bg-rose-50 border border-rose-300 text-xs text-rose-900 font-sans">
            <strong>NCBI Query Error:</strong> {ncbiError}
          </div>
        )}

        {/* Plain bordered monospaced textarea */}
        <textarea
          id="dna-sequence-input"
          rows={6}
          value={rawSequence}
          onChange={(e) => setRawSequence(e.target.value)}
          placeholder="Paste raw sequence or FASTA format (e.g. >gi|beta-globin\nATGGTGCACCTGACTCCTGAGGAGAAGTCTGCCGTT...)"
          className="w-full p-2.5 bg-white border border-slate-400 font-mono text-xs text-slate-900 focus:outline-none focus:border-slate-800 leading-relaxed rounded-none"
          spellCheck={false}
        />

        {/* Validation error display */}
        {!validation.isValid && rawSequence.trim().length > 0 && (
          <div className="p-2.5 bg-rose-50 border border-rose-300 text-xs text-rose-900 font-sans">
            <strong>Input Validation Error:</strong> {validation.error}
          </div>
        )}

        {validation.fastaHeader && (
          <div className="text-[11px] text-slate-600 font-mono">
            FASTA Header: &gt;{validation.fastaHeader}
          </div>
        )}

        {/* Action button */}
        <div className="pt-1 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              // Trigger analysis validation & scroll to results
            }}
            className="btn-primary"
          >
            Analyze Sequence
          </button>

          {isSeqValid && (
            <span className="text-[11px] font-mono text-emerald-800 font-semibold">
              ✓ Valid sequence: {activeSequence.length} nucleotides parsed
            </span>
          )}
        </div>
      </div>

      {/* 3. Results Section */}
      {isSeqValid && (
        <div className="space-y-6 pt-2">
          <hr className="border-t border-slate-300" />

          {/* Ambiguity notice if applicable */}
          {stats.gcContent.hasAmbiguityWarning && (
            <div className="p-3 bg-amber-50 border border-amber-300 text-xs text-amber-950 font-sans leading-relaxed">
              <strong>IUPAC Ambiguity Warning:</strong> {stats.gcContent.note}
            </div>
          )}

          {/* Sequence Summary Table */}
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-wide">
              Sequence Summary
            </h2>
            <table className="table-dense">
              <thead>
                <tr>
                  <th className="w-1/4">Property</th>
                  <th className="w-1/4">Value</th>
                  <th className="w-1/4">Calculation / Denominator</th>
                  <th className="w-1/4">Biological Relevance</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-sans font-medium">Sequence Length</td>
                  <td><strong>{stats.totalLength.toLocaleString()}</strong> nt</td>
                  <td className="text-slate-600">Total nucleotide count</td>
                  <td className="font-sans text-slate-600">Full sequence coordinate span</td>
                </tr>
                <tr>
                  <td className="font-sans font-medium">Standard Nucleotides (A, T, G, C)</td>
                  <td>{stats.unambiguousLength.toLocaleString()} nt</td>
                  <td className="text-slate-600">{((stats.unambiguousLength / stats.totalLength) * 100).toFixed(1)}% of total</td>
                  <td className="font-sans text-slate-600">Unambiguous deoxynucleotide bases</td>
                </tr>
                <tr>
                  <td className="font-sans font-medium">Ambiguous Bases (IUPAC)</td>
                  <td className={stats.ambiguousLength > 0 ? 'text-amber-800 font-bold' : ''}>
                    {stats.ambiguousLength} nt
                  </td>
                  <td className="text-slate-600">{stats.percentages.ambiguous}% of total</td>
                  <td className="font-sans text-slate-600">Degenerate base positions or sequencing uncertainty</td>
                </tr>
                <tr>
                  <td className="font-sans font-medium">GC Content</td>
                  <td><strong className="text-slate-900 text-sm">{stats.gcContent.standard}%</strong></td>
                  <td className="text-slate-600 font-mono">((G + C) / {stats.totalLength}) × 100</td>
                  <td className="font-sans text-slate-600">Thermal melting stability (Tm); 3 H-bonds per G≡C pair</td>
                </tr>
                {stats.gcContent.hasAmbiguityWarning && (
                  <tr className="bg-amber-50/50">
                    <td className="font-sans font-medium text-amber-900">GC% (Unambiguous Fraction)</td>
                    <td><strong>{stats.gcContent.unambiguousFraction}%</strong></td>
                    <td className="text-slate-600 font-mono">((G + C) / {stats.unambiguousLength}) × 100</td>
                    <td className="font-sans text-slate-600">Range across possible base identities: {stats.gcContent.minPossible}% – {stats.gcContent.maxPossible}%</td>
                  </tr>
                )}
                <tr>
                  <td className="font-sans font-medium">AT Content</td>
                  <td><strong>{stats.atContent.standard}%</strong></td>
                  <td className="text-slate-600 font-mono">((A + T) / {stats.totalLength}) × 100</td>
                  <td className="font-sans text-slate-600">2 H-bonds per A=T pair; flexible replication origins</td>
                </tr>
                <tr>
                  <td className="font-sans font-medium">Estimated Molecular Weight</td>
                  <td>~{stats.molecularWeightEstimatedDa.toLocaleString()} Da</td>
                  <td className="text-slate-600">g/mol (single-stranded DNA)</td>
                  <td className="font-sans text-slate-600">Sum of dNMP masses minus condensation water loss</td>
                </tr>
                <tr>
                  <td className="font-sans font-medium">Complete Codons (Frame 1)</td>
                  <td>{Math.floor(stats.totalLength / 3)} codons</td>
                  <td className="text-slate-600">
                    {stats.totalLength % 3 > 0 ? `+ ${stats.totalLength % 3} trailing base(s)` : 'Exact triplet integer'}
                  </td>
                  <td className="font-sans text-slate-600">Potential protein-coding length</td>
                </tr>
              </tbody>
            </table>
          </div>

          <hr className="border-t border-slate-300" />

          {/* Nucleotide Composition Section */}
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-wide">
              Nucleotide Composition
            </h2>

            {/* Horizontal Distribution Bar */}
            <div className="mb-3">
              <div className="text-[11px] text-slate-600 mb-1 flex justify-between font-mono">
                <span>Base distribution proportion:</span>
                <span>A: {stats.percentages.A}% | T: {stats.percentages.T}% | G: {stats.percentages.G}% | C: {stats.percentages.C}%</span>
              </div>
              <div className="w-full h-5 border border-slate-400 flex bg-slate-200 text-[10px] font-mono text-white text-center leading-5 select-none overflow-hidden">
                <div style={{ width: `${stats.percentages.A}%` }} className="bg-emerald-700" title={`Adenine: ${stats.counts.A} (${stats.percentages.A}%)`}>
                  {stats.percentages.A > 8 ? `A ${stats.percentages.A}%` : ''}
                </div>
                <div style={{ width: `${stats.percentages.T}%` }} className="bg-rose-700" title={`Thymine: ${stats.counts.T} (${stats.percentages.T}%)`}>
                  {stats.percentages.T > 8 ? `T ${stats.percentages.T}%` : ''}
                </div>
                <div style={{ width: `${stats.percentages.G}%` }} className="bg-amber-700" title={`Guanine: ${stats.counts.G} (${stats.percentages.G}%)`}>
                  {stats.percentages.G > 8 ? `G ${stats.percentages.G}%` : ''}
                </div>
                <div style={{ width: `${stats.percentages.C}%` }} className="bg-sky-700" title={`Cytosine: ${stats.counts.C} (${stats.percentages.C}%)`}>
                  {stats.percentages.C > 8 ? `C ${stats.percentages.C}%` : ''}
                </div>
                {stats.percentages.ambiguous > 0 && (
                  <div style={{ width: `${stats.percentages.ambiguous}%` }} className="bg-purple-700" title={`Ambiguous: ${stats.ambiguousLength} (${stats.percentages.ambiguous}%)`}>
                    {stats.percentages.ambiguous > 5 ? `N ${stats.percentages.ambiguous}%` : ''}
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Nucleotide Table */}
            <table className="table-dense">
              <thead>
                <tr>
                  <th>Nucleotide Base</th>
                  <th>Symbol</th>
                  <th className="text-right">Count</th>
                  <th className="text-right">Percentage (%)</th>
                  <th>Chemical Classification</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-sans font-medium text-slate-900">Adenine</td>
                  <td className="font-bold text-emerald-800">A</td>
                  <td className="text-right">{stats.counts.A}</td>
                  <td className="text-right">{stats.percentages.A}%</td>
                  <td className="font-sans text-slate-600">Purine (6-aminopurine, 2 hydrogen bonds with T)</td>
                </tr>
                <tr>
                  <td className="font-sans font-medium text-slate-900">Thymine</td>
                  <td className="font-bold text-rose-800">T</td>
                  <td className="text-right">{stats.counts.T}</td>
                  <td className="text-right">{stats.percentages.T}%</td>
                  <td className="font-sans text-slate-600">Pyrimidine (5-methyluracil, 2 hydrogen bonds with A)</td>
                </tr>
                <tr>
                  <td className="font-sans font-medium text-slate-900">Guanine</td>
                  <td className="font-bold text-amber-800">G</td>
                  <td className="text-right">{stats.counts.G}</td>
                  <td className="text-right">{stats.percentages.G}%</td>
                  <td className="font-sans text-slate-600">Purine (2-amino-6-oxopurine, 3 hydrogen bonds with C)</td>
                </tr>
                <tr>
                  <td className="font-sans font-medium text-slate-900">Cytosine</td>
                  <td className="font-bold text-sky-800">C</td>
                  <td className="text-right">{stats.counts.C}</td>
                  <td className="text-right">{stats.percentages.C}%</td>
                  <td className="font-sans text-slate-600">Pyrimidine (4-amino-2-oxopyrimidine, 3 hydrogen bonds with G)</td>
                </tr>
                {stats.ambiguousLength > 0 && (
                  <tr className="bg-purple-50/50">
                    <td className="font-sans font-medium text-purple-900">IUPAC Ambiguous Codes</td>
                    <td className="font-bold text-purple-900">{Object.keys(stats.counts.ambiguous).join(', ')}</td>
                    <td className="text-right font-bold text-purple-900">{stats.ambiguousLength}</td>
                    <td className="text-right font-bold text-purple-900">{stats.percentages.ambiguous}%</td>
                    <td className="font-sans text-purple-800 text-[11px]">
                      Details: {Object.entries(stats.counts.ambiguous).map(([c, n]) => `${c}=${n}`).join(', ')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Sliding Window GC Profile Chart */}
          {gcProfile.length > 1 && (
            <div className="border border-slate-300 bg-white p-3 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800 uppercase text-[11px] tracking-wide">
                  Sliding-Window GC Content Profile
                </span>
                <span className="text-slate-500 font-mono text-[11px]">
                  Window: 30 nt | Step: 5 nt | Baseline: 50%
                </span>
              </div>

              {/* Technical SVG Plot */}
              <div className="w-full overflow-x-auto">
                <svg
                  viewBox="0 0 760 140"
                  className="w-full h-32 select-none"
                  preserveAspectRatio="none"
                >
                  {/* Grid Lines */}
                  <line x1="40" y1="20" x2="740" y2="20" stroke="#cbd5e1" strokeDasharray="2 2" />
                  <line x1="40" y1="65" x2="740" y2="65" stroke="#94a3b8" />
                  <line x1="40" y1="110" x2="740" y2="110" stroke="#cbd5e1" strokeDasharray="2 2" />

                  {/* Y Axis text */}
                  <text x="34" y="24" textAnchor="end" className="text-[10px] font-mono fill-slate-500">100%</text>
                  <text x="34" y="69" textAnchor="end" className="text-[10px] font-mono fill-slate-700 font-bold">50%</text>
                  <text x="34" y="114" textAnchor="end" className="text-[10px] font-mono fill-slate-500">0%</text>

                  {/* GC line points */}
                  {(() => {
                    const minP = gcProfile[0].position;
                    const maxP = gcProfile[gcProfile.length - 1].position;
                    const span = Math.max(1, maxP - minP);
                    const getX = (p: number) => 40 + ((p - minP) / span) * 700;
                    const getY = (v: number) => 20 + 90 - (v / 100) * 90;
                    const pts = gcProfile.map(pt => `${getX(pt.position)},${getY(pt.gcPercent)}`).join(' ');
                    return (
                      <polyline
                        points={pts}
                        fill="none"
                        stroke="#1e3a8a"
                        strokeWidth="1.5"
                      />
                    );
                  })()}

                  {/* X Axis line & labels */}
                  <line x1="40" y1="110" x2="740" y2="110" stroke="#64748b" />
                  <text x="40" y="128" textAnchor="start" className="text-[10px] font-mono fill-slate-500">
                    Pos: {gcProfile[0].position} nt
                  </text>
                  <text x="390" y="128" textAnchor="middle" className="text-[10px] font-mono fill-slate-500">
                    Pos: {Math.round((gcProfile[0].position + gcProfile[gcProfile.length - 1].position) / 2)} nt
                  </text>
                  <text x="740" y="128" textAnchor="end" className="text-[10px] font-mono fill-slate-500">
                    Pos: {gcProfile[gcProfile.length - 1].position} nt
                  </text>
                </svg>
              </div>
            </div>
          )}

          <hr className="border-t border-slate-300" />

          {/* Sequence Operations Section */}
          {transformations && (
            <div>
              <h2 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-wide">
                Sequence Operations
              </h2>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-1 mb-2 bg-slate-200 p-1 border border-slate-300 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTransform('revcomp')}
                  className={`px-3 py-1 font-medium cursor-pointer ${
                    activeTransform === 'revcomp'
                      ? 'bg-white text-slate-900 border border-slate-400 font-bold'
                      : 'text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  Reverse Complement (5'→3')
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTransform('comp')}
                  className={`px-3 py-1 font-medium cursor-pointer ${
                    activeTransform === 'comp'
                      ? 'bg-white text-slate-900 border border-slate-400 font-bold'
                      : 'text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  Direct Complement (3'→5')
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTransform('rev')}
                  className={`px-3 py-1 font-medium cursor-pointer ${
                    activeTransform === 'rev'
                      ? 'bg-white text-slate-900 border border-slate-400 font-bold'
                      : 'text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  Reverse Sequence (3'→5')
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTransform('rna')}
                  className={`px-3 py-1 font-medium cursor-pointer ${
                    activeTransform === 'rna'
                      ? 'bg-white text-slate-900 border border-slate-400 font-bold'
                      : 'text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  Transcribe to mRNA (T→U)
                </button>
              </div>

              {/* Generated Sequence Output Box */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">
                    Generated Sequence Output:
                  </span>
                  <div className="flex items-center gap-2">
                    {copiedNotice && (
                      <span className="text-[11px] font-mono text-emerald-800 font-semibold">
                        ✓ Copied to clipboard
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const txt =
                          activeTransform === 'revcomp' ? transformations.reverseComplement :
                          activeTransform === 'comp' ? transformations.complement :
                          activeTransform === 'rev' ? transformations.reverse :
                          transformations.transcribedRNA;
                        handleCopyText(txt, activeTransform);
                      }}
                      className="btn-classic text-[11px]"
                    >
                      Copy Sequence
                    </button>
                  </div>
                </div>

                <div className="p-2.5 bg-white border border-slate-400 font-mono text-xs text-slate-900 break-all select-all max-h-36 overflow-y-auto leading-relaxed">
                  {activeTransform === 'revcomp' && transformations.reverseComplement}
                  {activeTransform === 'comp' && transformations.complement}
                  {activeTransform === 'rev' && transformations.reverse}
                  {activeTransform === 'rna' && transformations.transcribedRNA}
                </div>
              </div>
            </div>
          )}

          <hr className="border-t border-slate-300" />

          {/* Sequence Inspection Viewer */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Formatted Sequence Display
              </h2>

              <div className="flex items-center gap-2 text-xs">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syntaxColoring}
                    onChange={(e) => setSyntaxColoring(e.target.checked)}
                    className="rounded-none border-slate-400"
                  />
                  <span>Syntax Colors</span>
                </label>

                <span className="text-slate-300">|</span>

                <span className="text-slate-600">Grouping:</span>
                <select
                  value={chunkMode}
                  onChange={(e) => setChunkMode(e.target.value as any)}
                  className="bg-white border border-slate-400 text-xs px-1 py-0.5"
                >
                  <option value="decamer">10-nt Decamers</option>
                  <option value="triplet">3-nt Codon Triplets</option>
                  <option value="continuous">Continuous</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleCopyText(activeSequence, 'primary')}
                  className="btn-classic text-[11px]"
                >
                  Copy Clean DNA
                </button>

                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  className="btn-classic text-[11px]"
                >
                  Save .TXT Report
                </button>
              </div>
            </div>

            {/* Sequence block table */}
            <div className="border border-slate-400 bg-white p-3 font-mono text-xs overflow-x-auto max-h-72">
              <table className="w-full border-collapse">
                <tbody>
                  {formatSequenceRows(activeSequence).map((row) => (
                    <tr key={row.start} className="hover:bg-slate-100/60">
                      <td className="w-14 text-right pr-3 select-none text-slate-400 text-[11px]">
                        {row.start}
                      </td>
                      <td className="tracking-wider select-all py-0.5">
                        <div className="flex flex-wrap items-center gap-x-2">
                          {row.chunks.map((chunk, cIdx) => (
                            <span key={cIdx} className="inline-block">
                              {chunk.split('').map((ch, chIdx) => (
                                <span key={chIdx} className={getBaseColorStyle(ch)}>
                                  {ch}
                                </span>
                              ))}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="w-14 text-right pl-3 select-none text-slate-400 text-[11px]">
                        {row.end}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {syntaxColoring && (
              <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono text-slate-600">
                <div className="flex items-center gap-3">
                  <span className="text-emerald-800 font-bold">A = Adenine</span>
                  <span className="text-rose-800 font-bold">T = Thymine</span>
                  <span className="text-amber-800 font-bold">G = Guanine</span>
                  <span className="text-sky-800 font-bold">C = Cytosine</span>
                  <span className="text-indigo-800 font-bold">IUPAC Ambiguous</span>
                </div>
                <span>Coordinates: 1-based (5' → 3')</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
