import React, { useState, useEffect } from 'react';
import {
  Search,
  Dna,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import {
  lookupEnsemblSymbol,
  lookupEnsemblId,
  fetchEnsemblSequence,
  EnsemblGene,
  EnsemblTranscript,
} from '../services/api/ensembl';
import {
  searchNcbiGenes,
  NcbiGeneSummary,
} from '../services/api/ncbi';
import { SourceBadge } from '../components/research/SourceBadge';
import { CrossReferenceList } from '../components/research/CrossReferenceList';
import { LoadingState } from '../components/research/LoadingState';
import { ErrorState } from '../components/research/ErrorState';
import { ScientificApiError } from '../services/api/apiClient';

interface GeneExplorerProps {
  initialQuery?: string;
  onLoadSequence?: (name: string, sequence: string) => void;
  onNavigate?: (tab: any, query?: string) => void;
}

const COMMON_SPECIES = [
  { id: 'homo_sapiens', name: 'Homo sapiens (Human)' },
  { id: 'mus_musculus', name: 'Mus musculus (Mouse)' },
  { id: 'rattus_norvegicus', name: 'Rattus norvegicus (Rat)' },
  { id: 'danio_rerio', name: 'Danio rerio (Zebrafish)' },
  { id: 'drosophila_melanogaster', name: 'Drosophila melanogaster (Fruit fly)' },
  { id: 'caenorhabditis_elegans', name: 'Caenorhabditis elegans (Nematode)' },
  { id: 'saccharomyces_cerevisiae', name: 'Saccharomyces cerevisiae (Yeast)' },
];

const PRESET_GENES = [
  { symbol: 'HBB', desc: 'Hemoglobin Subunit Beta', species: 'homo_sapiens' },
  { symbol: 'TP53', desc: 'Tumor Protein P53', species: 'homo_sapiens' },
  { symbol: 'BRCA1', desc: 'BRCA1 DNA Repair Associated', species: 'homo_sapiens' },
  { symbol: 'INS', desc: 'Insulin', species: 'homo_sapiens' },
  { symbol: 'EGFR', desc: 'Epidermal Growth Factor Receptor', species: 'homo_sapiens' },
  { symbol: 'GAPDH', desc: 'Glyceraldehyde-3-Phosphate Dehydrogenase', species: 'homo_sapiens' },
];

export const GeneExplorer: React.FC<GeneExplorerProps> = ({
  initialQuery = 'HBB',
  onLoadSequence,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [selectedSpecies, setSelectedSpecies] = useState('homo_sapiens');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ScientificApiError | null>(null);

  // Results
  const [ensemblGene, setEnsemblGene] = useState<EnsemblGene | null>(null);
  const [ncbiGene, setNcbiGene] = useState<NcbiGeneSummary | null>(null);
  const [selectedTranscript, setSelectedTranscript] = useState<EnsemblTranscript | null>(null);
  const [sequenceLoading, setSequenceLoading] = useState(false);
  const [sequenceData, setSequenceData] = useState<{ id: string; seq: string; type: string } | null>(null);
  const [copiedSeq, setCopiedSeq] = useState(false);

  const performSearch = async (geneSymbol: string, species: string) => {
    if (!geneSymbol.trim()) return;
    setLoading(true);
    setError(null);
    setEnsemblGene(null);
    setNcbiGene(null);
    setSelectedTranscript(null);
    setSequenceData(null);

    const term = geneSymbol.trim().toUpperCase();

    try {
      // Parallel fetch from Ensembl and NCBI Gene
      const [ensemblResult, ncbiResult] = await Promise.allSettled([
        term.startsWith('ENS') ? lookupEnsemblId(term) : lookupEnsemblSymbol(term, species),
        searchNcbiGenes(term, 1),
      ]);

      let hasSuccess = false;

      if (ensemblResult.status === 'fulfilled' && ensemblResult.value) {
        setEnsemblGene(ensemblResult.value);
        if (ensemblResult.value.transcripts && ensemblResult.value.transcripts.length > 0) {
          const canonical = ensemblResult.value.transcripts.find(t => t.isCanonical) || ensemblResult.value.transcripts[0];
          setSelectedTranscript(canonical);
          fetchTranscriptSeq(canonical.id, 'cdna');
        }
        hasSuccess = true;
      }

      if (ncbiResult.status === 'fulfilled' && ncbiResult.value && ncbiResult.value.length > 0) {
        setNcbiGene(ncbiResult.value[0]);
        hasSuccess = true;
      }

      if (!hasSuccess) {
        throw new ScientificApiError(
          `No matching gene records found for "${geneSymbol}" in ${species}.`,
          'ensembl',
          404,
          false,
          'Verify the gene symbol (e.g. HBB, TP53, BRCA1) and verify the organism selection.'
        );
      }
    } catch (err: any) {
      if (err instanceof ScientificApiError) {
        setError(err);
      } else {
        setError(new ScientificApiError(
          err.message || 'Failed to search gene database.',
          'ensembl',
          500,
          false,
          'Check network connectivity or try an alternate gene symbol.'
        ));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTranscriptSeq = async (transcriptId: string, seqType: 'cdna' | 'genomic' | 'cds') => {
    setSequenceLoading(true);
    try {
      const res = await fetchEnsemblSequence(transcriptId, seqType);
      setSequenceData({
        id: transcriptId,
        seq: res.sequence,
        type: seqType.toUpperCase(),
      });
    } catch {
      // Non-fatal
    } finally {
      setSequenceLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, selectedSpecies);
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchTerm, selectedSpecies);
  };

  const handlePresetClick = (preset: typeof PRESET_GENES[0]) => {
    setSearchTerm(preset.symbol);
    setSelectedSpecies(preset.species);
    performSearch(preset.symbol, preset.species);
  };

  const handleCopySequence = () => {
    if (!sequenceData?.seq) return;
    navigator.clipboard.writeText(sequenceData.seq);
    setCopiedSeq(true);
    setTimeout(() => setCopiedSeq(false), 2000);
  };

  const handleLoadToAnalyzer = () => {
    if (!sequenceData?.seq || !onLoadSequence) return;
    const name = `${ensemblGene?.symbol || searchTerm} (${sequenceData.id} ${sequenceData.type})`;
    onLoadSequence(name, sequenceData.seq);
  };

  return (
    <div className="space-y-4">
      {/* Search Header Form */}
      <div className="bg-white border border-slate-300 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 border-b border-slate-200 pb-3">
          <div>
            <h1 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Dna className="w-4 h-4 text-slate-700" />
              Gene &amp; Transcript Explorer
            </h1>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Query Ensembl REST API and NCBI Gene E-utilities for official coordinates, transcripts, and sequence definitions.
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <SourceBadge source="Ensembl" />
            <SourceBadge source="NCBI Gene" />
          </div>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter gene symbol or Ensembl ID (e.g. HBB, TP53, ENSG00000244734)..."
              className="w-full bg-slate-50 border border-slate-300 px-3 py-1.5 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-slate-800"
            />
          </div>

          <select
            value={selectedSpecies}
            onChange={(e) => setSelectedSpecies(e.target.value)}
            className="bg-slate-50 border border-slate-300 px-2 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-slate-800 cursor-pointer"
          >
            {COMMON_SPECIES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={loading || !searchTerm.trim()}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Query Database</span>
          </button>
        </form>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100 flex-wrap text-[11px]">
          <span className="text-slate-500 font-medium">Standard Presets:</span>
          {PRESET_GENES.map((preset) => (
            <button
              key={preset.symbol}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-mono text-[10px] cursor-pointer"
            >
              {preset.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && <LoadingState message="Connecting to Ensembl REST and NCBI Gene E-utilities..." source="Ensembl / NCBI" />}
      {error && !loading && <ErrorState error={error} onRetry={() => performSearch(searchTerm, selectedSpecies)} />}

      {/* Gene Data Display */}
      {!loading && (ensemblGene || ncbiGene) && (
        <div className="space-y-4">
          {/* Gene Overview Panel */}
          <div className="bg-white border border-slate-300">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-900 font-mono">
                  {ensemblGene?.symbol || ncbiGene?.name || searchTerm}
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-xs text-slate-700">
                  {ncbiGene?.description || ensemblGene?.description || 'Gene Record'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {ensemblGene && (
                  <SourceBadge
                    source="Ensembl"
                    externalUrl={ensemblGene.sourceUrl}
                  />
                )}
                {ncbiGene && (
                  <SourceBadge
                    source="NCBI Gene"
                    externalUrl={ncbiGene.sourceUrl}
                  />
                )}
              </div>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
              <div className="bg-slate-50 p-2.5 border border-slate-200">
                <div className="text-[10px] uppercase font-sans text-slate-500 font-semibold">Ensembl Gene ID</div>
                <div className="text-slate-900 font-bold mt-0.5 truncate" title={ensemblGene?.id || 'N/A'}>
                  {ensemblGene?.id || 'N/A'}
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 border border-slate-200">
                <div className="text-[10px] uppercase font-sans text-slate-500 font-semibold">NCBI Gene UID</div>
                <div className="text-slate-900 font-bold mt-0.5">
                  {ncbiGene?.uid || 'N/A'}
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 border border-slate-200">
                <div className="text-[10px] uppercase font-sans text-slate-500 font-semibold">Genomic Coordinates</div>
                <div className="text-slate-900 mt-0.5 text-[11px]">
                  {ensemblGene ? (
                    `Chr ${ensemblGene.seqRegionName}:${ensemblGene.start.toLocaleString()}–${ensemblGene.end.toLocaleString()} (${ensemblGene.strand === 1 ? '+' : '-'})`
                  ) : ncbiGene ? (
                    `Chr ${ncbiGene.chromosome || 'Unknown'}`
                  ) : 'N/A'}
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 border border-slate-200">
                <div className="text-[10px] uppercase font-sans text-slate-500 font-semibold">Biotype / Span</div>
                <div className="text-slate-900 mt-0.5 text-[11px]">
                  {ensemblGene ? (
                    `${ensemblGene.biotype} (${(ensemblGene.end - ensemblGene.start + 1).toLocaleString()} bp)`
                  ) : 'Protein Coding'}
                </div>
              </div>
            </div>

            {/* Gene Summary Text */}
            {ncbiGene?.summary && (
              <div className="px-4 pb-4">
                <div className="bg-slate-50 border border-slate-200 p-3 text-xs leading-relaxed text-slate-800">
                  <span className="font-bold text-slate-900 font-sans block mb-1 text-[11px] uppercase tracking-wider">
                    Official NCBI Functional Summary:
                  </span>
                  {ncbiGene.summary}
                </div>
              </div>
            )}
          </div>

          {/* Transcripts Table (Ensembl) */}
          {ensemblGene?.transcripts && ensemblGene.transcripts.length > 0 && (
            <div className="bg-white border border-slate-300">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 uppercase tracking-wider font-sans">
                  Transcript Isoforms ({ensemblGene.transcripts.length} identified)
                </span>
                <span className="text-[10px] text-slate-500 font-sans">
                  Click a row to inspect sequence
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse font-mono">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-sans text-[11px]">
                      <th className="p-2 border-r border-slate-200">Transcript ID</th>
                      <th className="p-2 border-r border-slate-200">Biotype</th>
                      <th className="p-2 border-r border-slate-200">Genomic Span</th>
                      <th className="p-2 border-r border-slate-200">Length</th>
                      <th className="p-2 border-r border-slate-200">Status</th>
                      <th className="p-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ensemblGene.transcripts.map((t) => {
                      const isSelected = selectedTranscript?.id === t.id;
                      const spanLength = t.length || (t.end - t.start + 1);
                      return (
                        <tr
                          key={t.id}
                          onClick={() => {
                            setSelectedTranscript(t);
                            fetchTranscriptSeq(t.id, 'cdna');
                          }}
                          className={`border-b border-slate-200 cursor-pointer transition-colors ${
                            isSelected ? 'bg-amber-50 font-semibold' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="p-2 border-r border-slate-200 text-slate-900 flex items-center gap-1.5">
                            <ChevronRight className={`w-3 h-3 ${isSelected ? 'text-slate-900' : 'text-slate-400'}`} />
                            <span>{t.id}</span>
                          </td>
                          <td className="p-2 border-r border-slate-200 text-slate-700 font-sans">{t.biotype}</td>
                          <td className="p-2 border-r border-slate-200 text-slate-700">
                            {t.start.toLocaleString()} – {t.end.toLocaleString()}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-slate-700">
                            {spanLength.toLocaleString()} bp
                          </td>
                          <td className="p-2 border-r border-slate-200">
                            {t.isCanonical ? (
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-sans font-bold">
                                CANONICAL
                              </span>
                            ) : (
                              <span className="text-slate-400 font-sans text-[11px]">Isoform</span>
                            )}
                          </td>
                          <td className="p-2 text-right font-sans">
                            <a
                              href={`https://www.ensembl.org/${selectedSpecies}/Transcript/Summary?t=${t.id}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-slate-700 hover:text-slate-900 hover:underline text-[11px] inline-flex items-center gap-1"
                            >
                              <span>Ensembl</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sequence Preview & Load to Analyzer */}
          {selectedTranscript && (
            <div className="bg-white border border-slate-300">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900 font-mono">
                    Sequence: {selectedTranscript.id}
                  </span>
                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => fetchTranscriptSeq(selectedTranscript.id, 'cdna')}
                      className={`px-2 py-0.5 border cursor-pointer ${
                        sequenceData?.type === 'CDNA'
                          ? 'bg-slate-800 text-white border-slate-800 font-bold'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      cDNA
                    </button>
                    <button
                      type="button"
                      onClick={() => fetchTranscriptSeq(selectedTranscript.id, 'cds')}
                      className={`px-2 py-0.5 border cursor-pointer ${
                        sequenceData?.type === 'CDS'
                          ? 'bg-slate-800 text-white border-slate-800 font-bold'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      CDS (Coding)
                    </button>
                    <button
                      type="button"
                      onClick={() => fetchTranscriptSeq(selectedTranscript.id, 'genomic')}
                      className={`px-2 py-0.5 border cursor-pointer ${
                        sequenceData?.type === 'GENOMIC'
                          ? 'bg-slate-800 text-white border-slate-800 font-bold'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Genomic
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopySequence}
                    disabled={!sequenceData?.seq}
                    className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs flex items-center gap-1 cursor-pointer font-sans"
                  >
                    {copiedSeq ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSeq ? 'Copied' : 'Copy Sequence'}</span>
                  </button>

                  {onLoadSequence && (
                    <button
                      type="button"
                      onClick={handleLoadToAnalyzer}
                      disabled={!sequenceData?.seq}
                      className="px-3 py-1 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer font-sans"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Load into Sequence Analyzer</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4">
                {sequenceLoading ? (
                  <div className="py-6 text-center text-xs text-slate-500 font-mono flex items-center justify-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Retrieving official Ensembl nucleotide sequence...</span>
                  </div>
                ) : sequenceData?.seq ? (
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mb-1">
                      <span>FASTA Representation ({sequenceData.seq.length.toLocaleString()} bp)</span>
                      <span>5' to 3'</span>
                    </div>
                    <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-56 select-all whitespace-pre-wrap break-all leading-tight">
                      {`>${selectedTranscript.id} ${selectedSpecies} ${sequenceData.type} length=${sequenceData.seq.length}\n`}
                      {sequenceData.seq}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-slate-500">
                    No sequence loaded. Select a sequence type button above to retrieve data.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cross References & Pathway/Protein links */}
          <CrossReferenceList
            geneSymbol={ensemblGene?.symbol || ncbiGene?.name || searchTerm}
            onNavigate={onNavigate}
          />
        </div>
      )}
    </div>
  );
};
