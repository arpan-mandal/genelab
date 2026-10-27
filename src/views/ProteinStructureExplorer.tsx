import React, { useState, useEffect } from 'react';
import {
  Search,
  Box,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  Award,
  ArrowRight,
} from 'lucide-react';
import {
  searchUniProt,
  fetchUniProtByAccession,
  UniProtProtein,
} from '../services/api/uniprot';
import {
  searchPdbStructures,
  fetchPdbStructureById,
  PdbStructure,
} from '../services/api/rcsb';
import { MolecularViewer } from '../components/research/MolecularViewer';
import { SourceBadge } from '../components/research/SourceBadge';
import { CrossReferenceList } from '../components/research/CrossReferenceList';
import { LoadingState } from '../components/research/LoadingState';
import { ErrorState } from '../components/research/ErrorState';
import { ScientificApiError } from '../services/api/apiClient';

interface ProteinStructureExplorerProps {
  initialQuery?: string;
  onNavigate?: (tab: any, query?: string) => void;
  onLoadSequence?: (name: string, sequence: string) => void;
}

const PRESET_PROTEINS = [
  { label: 'Hemoglobin β (HBB)', query: 'P68871', pdb: '4HHB' },
  { label: 'Tumor Protein p53 (TP53)', query: 'P04637', pdb: '1TUP' },
  { label: 'Insulin (INS)', query: 'P01308', pdb: '1BEN' },
  { label: 'BRCA1 Repair Protein', query: 'P38398', pdb: '1J82' },
  { label: 'EGFR Kinase Domain', query: 'P00533', pdb: '1M17' },
  { label: 'SARS-CoV-2 Spike Glycoprotein', query: 'P0DTC2', pdb: '6VXX' },
];

export const ProteinStructureExplorer: React.FC<ProteinStructureExplorerProps> = ({
  initialQuery = 'P68871',
  onNavigate,
  onLoadSequence,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ScientificApiError | null>(null);

  // Protein record & PDB metadata
  const [proteinEntry, setProteinEntry] = useState<UniProtProtein | null>(null);
  const [activePdbId, setActivePdbId] = useState<string>('4HHB');
  const [pdbMetadata, setPdbMetadata] = useState<PdbStructure | null>(null);

  const [copiedSeq, setCopiedSeq] = useState(false);

  const performSearch = async (queryStr: string) => {
    if (!queryStr.trim()) return;
    setLoading(true);
    setError(null);
    setProteinEntry(null);
    setPdbMetadata(null);

    const term = queryStr.trim().toUpperCase();

    try {
      let entry: UniProtProtein | null = null;

      // Check if it's already an accession (e.g. P68871)
      if (/^[A-N,R-Z][0-9][A-Z][A-Z, 0-9][A-Z, 0-9][0-9]$/i.test(term)) {
        try {
          entry = await fetchUniProtByAccession(term);
        } catch {
          // Fallback to search
        }
      }

      if (!entry) {
        // Search by symbol or keyword
        const results = await searchUniProt(term, false, 1);
        if (results.length > 0) {
          entry = results[0];
        }
      }

      if (!entry) {
        throw new ScientificApiError(
          `No protein record found for "${term}" in UniProtKB.`,
          'uniprot',
          404,
          false,
          'Try an official UniProt Accession (e.g. P68871, P04637, P01308) or standard gene symbol (HBB, TP53).'
        );
      }

      setProteinEntry(entry);

      // Determine initial PDB structure: UniProt cross-reference or fallback
      let initialPdb = entry.pdbIds[0] || '';
      if (!initialPdb) {
        try {
          const rcsbResults = await searchPdbStructures(entry.geneSymbol || term, 1);
          if (rcsbResults.length > 0) {
            initialPdb = rcsbResults[0].pdbId;
          }
        } catch {
          // Ignore
        }
      }

      if (initialPdb) {
        setActivePdbId(initialPdb);
        fetchPdbDetails(initialPdb);
      }
    } catch (err: any) {
      if (err instanceof ScientificApiError) {
        setError(err);
      } else {
        setError(new ScientificApiError(
          err.message || 'Failed to search protein database.',
          'uniprot',
          500,
          false,
          'Check network connectivity or search using a different term.'
        ));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPdbDetails = async (pdbId: string) => {
    try {
      const meta = await fetchPdbStructureById(pdbId);
      setPdbMetadata(meta);
    } catch {
      // Non-fatal
    }
  };

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchTerm);
  };

  const handleSelectPdb = (pdbId: string) => {
    setActivePdbId(pdbId);
    fetchPdbDetails(pdbId);
  };

  const handleCopySequence = () => {
    if (!proteinEntry?.sequence) return;
    navigator.clipboard.writeText(proteinEntry.sequence);
    setCopiedSeq(true);
    setTimeout(() => setCopiedSeq(false), 2000);
  };

  const handleLoadProteinSeq = () => {
    if (!proteinEntry || !onLoadSequence) return;
    const name = `${proteinEntry.geneSymbol || proteinEntry.id} (${proteinEntry.accession} aa)`;
    onLoadSequence(name, proteinEntry.sequence);
  };

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="bg-white border border-slate-300 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 border-b border-slate-200 pb-3">
          <div>
            <h1 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Box className="w-4 h-4 text-slate-700" />
              Protein &amp; 3D Molecular Structure Explorer
            </h1>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Query UniProtKB REST for curated functional domains and RCSB PDB for atomic 3D coordinates &amp; Mol* visualization.
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <SourceBadge source="UniProt" />
            <SourceBadge source="RCSB PDB" />
          </div>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter UniProt Accession (P68871) or Gene Symbol (HBB, TP53, INS)..."
              className="w-full bg-slate-50 border border-slate-300 px-3 py-1.5 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-slate-800"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !searchTerm.trim()}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Lookup Protein</span>
          </button>
        </form>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100 flex-wrap text-[11px]">
          <span className="text-slate-500 font-medium">Standard Presets:</span>
          {PRESET_PROTEINS.map((p) => (
            <button
              key={p.query}
              type="button"
              onClick={() => {
                setSearchTerm(p.query);
                performSearch(p.query);
              }}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-mono text-[10px] cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && <LoadingState message="Querying UniProtKB and RCSB PDB databases..." source="UniProt / RCSB PDB" />}
      {error && !loading && <ErrorState error={error} onRetry={() => performSearch(searchTerm)} />}

      {/* Protein Record Content */}
      {!loading && proteinEntry && (
        <div className="space-y-4">
          {/* Protein Metadata Card */}
          <div className="bg-white border border-slate-300">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-900 font-mono">
                  {proteinEntry.accession}
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-xs text-slate-800 font-semibold">
                  {proteinEntry.proteinName}
                </span>
                {proteinEntry.isReviewed && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-sans font-bold">
                    <Award className="w-3 h-3 text-amber-700" />
                    SWISS-PROT REVIEWED
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <SourceBadge
                  source="UniProt"
                  externalUrl={proteinEntry.sourceUrl}
                />
              </div>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-mono">
              <div className="bg-slate-50 p-2.5 border border-slate-200">
                <div className="text-[10px] uppercase font-sans text-slate-500 font-semibold">Gene Symbol</div>
                <div className="text-slate-900 font-bold mt-0.5">{proteinEntry.geneSymbol || 'N/A'}</div>
              </div>

              <div className="bg-slate-50 p-2.5 border border-slate-200">
                <div className="text-[10px] uppercase font-sans text-slate-500 font-semibold">Organism</div>
                <div className="text-slate-900 font-sans italic mt-0.5 truncate" title={proteinEntry.organism}>
                  {proteinEntry.organism}
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 border border-slate-200">
                <div className="text-[10px] uppercase font-sans text-slate-500 font-semibold">Chain Length</div>
                <div className="text-slate-900 font-bold mt-0.5">{proteinEntry.length.toLocaleString()} aa</div>
              </div>

              <div className="bg-slate-50 p-2.5 border border-slate-200">
                <div className="text-[10px] uppercase font-sans text-slate-500 font-semibold">Molecular Mass</div>
                <div className="text-slate-900 font-bold mt-0.5">{proteinEntry.massDa.toLocaleString()} Da</div>
              </div>

              <div className="bg-slate-50 p-2.5 border border-slate-200">
                <div className="text-[10px] uppercase font-sans text-slate-500 font-semibold">Subcellular Location</div>
                <div className="text-slate-900 font-sans mt-0.5 truncate text-[11px]" title={proteinEntry.subcellularLocations.join(', ') || 'N/A'}>
                  {proteinEntry.subcellularLocations.join(', ') || 'N/A'}
                </div>
              </div>
            </div>

            {/* Protein Sequence Segment */}
            <div className="px-4 pb-4">
              <div className="bg-slate-50 border border-slate-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 font-sans text-[11px] uppercase tracking-wider">
                    Full Amino Acid Sequence ({proteinEntry.length} aa):
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopySequence}
                      className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] flex items-center gap-1 cursor-pointer font-sans"
                    >
                      {copiedSeq ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSeq ? 'Copied' : 'Copy'}</span>
                    </button>
                    {onLoadSequence && (
                      <button
                        type="button"
                        onClick={handleLoadProteinSeq}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-900 text-white text-[11px] flex items-center gap-1 cursor-pointer font-sans"
                      >
                        <ArrowRight className="w-3 h-3" />
                        <span>Send to Workspace</span>
                      </button>
                    )}
                  </div>
                </div>
                <pre className="p-2.5 bg-slate-900 text-amber-300 font-mono text-xs overflow-x-auto max-h-36 select-all whitespace-pre-wrap break-all leading-tight">
                  {proteinEntry.sequence}
                </pre>
              </div>
            </div>
          </div>

          {/* 3D Structure & RCSB PDB Visualization Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: 3D Interactive Mol* Viewer (7 cols) */}
            <div className="lg:col-span-7 space-y-2">
              <MolecularViewer
                type="pdb"
                identifier={activePdbId}
                title={`PDB ID: ${activePdbId} — ${pdbMetadata?.title || proteinEntry.proteinName}`}
                externalUrl={`https://www.rcsb.org/structure/${activePdbId}`}
              />

              {/* PDB Structural Metadata */}
              {pdbMetadata && (
                <div className="bg-white border border-slate-300 p-3 text-xs font-mono">
                  <div className="font-bold text-slate-900 font-sans text-[11px] uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Crystallographic &amp; Experimental Metadata</span>
                    <SourceBadge source="RCSB PDB" externalUrl={`https://www.rcsb.org/structure/${activePdbId}`} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                    <div className="bg-slate-50 p-2 border border-slate-200">
                      <span className="text-slate-500 block font-sans text-[10px]">Method</span>
                      <span className="text-slate-900 font-bold">{pdbMetadata.experimentalMethod}</span>
                    </div>
                    <div className="bg-slate-50 p-2 border border-slate-200">
                      <span className="text-slate-500 block font-sans text-[10px]">Resolution</span>
                      <span className="text-slate-900 font-bold">
                        {pdbMetadata.resolution ? `${pdbMetadata.resolution} Å` : 'N/A'}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2 border border-slate-200">
                      <span className="text-slate-500 block font-sans text-[10px]">Release Date</span>
                      <span className="text-slate-900">{pdbMetadata.releaseDate || 'N/A'}</span>
                    </div>
                    <div className="bg-slate-50 p-2 border border-slate-200">
                      <span className="text-slate-500 block font-sans text-[10px]">Authors</span>
                      <span className="text-slate-900 truncate block" title={pdbMetadata.authors.join(', ')}>
                        {pdbMetadata.authors[0] || 'N/A'} et al.
                      </span>
                    </div>
                  </div>
                  {pdbMetadata.citation && (
                    <div className="mt-2 text-[11px] text-slate-700 bg-slate-50 p-2 border border-slate-200 font-sans">
                      <span className="font-semibold text-slate-900">Primary Citation: </span>
                      {pdbMetadata.citation.title} ({pdbMetadata.citation.journal || 'Journal'}, {pdbMetadata.citation.year})
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Available PDB Structures List & Curated Domains (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* PDB Structures Selector */}
              <div className="bg-white border border-slate-300">
                <div className="bg-slate-100 px-3 py-2 border-b border-slate-300 flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 uppercase font-sans">
                    Related PDB Structures ({proteinEntry.pdbIds.length})
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">RCSB PDB</span>
                </div>
                <div className="max-h-52 overflow-y-auto divide-y divide-slate-200">
                  {proteinEntry.pdbIds.length > 0 ? (
                    proteinEntry.pdbIds.map((pdb: string) => {
                      const isSelected = activePdbId.toUpperCase() === pdb.toUpperCase();
                      return (
                        <div
                          key={pdb}
                          onClick={() => handleSelectPdb(pdb)}
                          className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected ? 'bg-amber-50 font-bold' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Box className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-800' : 'text-slate-500'}`} />
                            <span className="font-mono text-xs text-slate-900">{pdb}</span>
                          </div>
                          <a
                            href={`https://www.rcsb.org/structure/${pdb}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] text-slate-500 hover:text-slate-900 flex items-center gap-1 font-sans"
                          >
                            <span>RCSB</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-500 font-sans">
                      No direct PDB cross-references in UniProt entry.
                    </div>
                  )}
                </div>
              </div>

              {/* Functional Features & Domains */}
              <div className="bg-white border border-slate-300">
                <div className="bg-slate-100 px-3 py-2 border-b border-slate-300 flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 uppercase font-sans">
                    Curated Features &amp; Domains
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{proteinEntry.features.length} items</span>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-200 font-mono text-[11px]">
                  {proteinEntry.features.length > 0 ? (
                    proteinEntry.features.map((feat, idx) => (
                      <div key={idx} className="p-2 hover:bg-slate-50">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 font-sans text-xs">{feat.type}</span>
                          <span className="text-slate-500">{feat.start} – {feat.end}</span>
                        </div>
                        {feat.description && (
                          <div className="text-slate-600 font-sans text-[11px] mt-0.5">
                            {feat.description}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-500 font-sans">
                      No specific domain annotations listed.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Cross References Panel */}
          <CrossReferenceList
            geneSymbol={proteinEntry.geneSymbol}
            uniprotId={proteinEntry.accession}
            onNavigate={onNavigate}
          />
        </div>
      )}
    </div>
  );
};
