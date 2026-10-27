import React, { useState, useEffect } from 'react';
import {
  Search,
  Network,
  ExternalLink,
  Database,
  RefreshCw,
  GitFork,
} from 'lucide-react';
import {
  fetchStringInteractions,
  generateNetworkImageUrl,
  StringInteraction,
} from '../services/api/string';
import {
  searchReactomePathways,
  generatePathwayDiagramUrl,
  ReactomePathway,
} from '../services/api/reactome';
import { SourceBadge } from '../components/research/SourceBadge';
import { CrossReferenceList } from '../components/research/CrossReferenceList';
import { LoadingState } from '../components/research/LoadingState';
import { ErrorState } from '../components/research/ErrorState';
import { ScientificApiError } from '../services/api/apiClient';

interface PathwayExplorerProps {
  initialQuery?: string;
  onNavigate?: (tab: any, query?: string) => void;
}

const PRESET_PATHWAY_GENES = [
  { symbol: 'TP53', desc: 'Cellular Tumor Antigen p53 / Apoptosis' },
  { symbol: 'BRCA1', desc: 'DNA Double-Strand Break Repair' },
  { symbol: 'EGFR', desc: 'Epidermal Growth Factor Signaling' },
  { symbol: 'INS', desc: 'Insulin Synthesis & Glucose Metabolism' },
  { symbol: 'HBB', desc: 'Hemoglobin Subunit Beta / Oxygen Transport' },
  { symbol: 'AKT1', desc: 'PI3K-Akt Survival Pathway' },
];

export const PathwayExplorer: React.FC<PathwayExplorerProps> = ({
  initialQuery = 'TP53',
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [minConfidence, setMinConfidence] = useState<number>(0.7); // 0.7 = High confidence
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ScientificApiError | null>(null);

  // Results
  const [stringPartners, setStringPartners] = useState<StringInteraction[]>([]);
  const [stringNetworkUrl, setStringNetworkUrl] = useState<string>('');
  const [reactomePathways, setReactomePathways] = useState<ReactomePathway[]>([]);
  const [selectedPathway, setSelectedPathway] = useState<ReactomePathway | null>(null);

  const performSearch = async (geneSymbol: string, confidence: number) => {
    if (!geneSymbol.trim()) return;
    setLoading(true);
    setError(null);
    setStringPartners([]);
    setReactomePathways([]);
    setSelectedPathway(null);

    const term = geneSymbol.trim().toUpperCase();

    try {
      // Parallel fetch from STRING and Reactome
      const [stringResult, reactomeResult] = await Promise.allSettled([
        fetchStringInteractions(term, 9606, 15),
        searchReactomePathways(term),
      ]);

      let hasSuccess = false;

      if (stringResult.status === 'fulfilled' && stringResult.value) {
        setStringPartners(stringResult.value.partners);
        setStringNetworkUrl(stringResult.value.networkImageUrl || generateNetworkImageUrl(term, 9606, confidence));
        hasSuccess = true;
      }

      if (reactomeResult.status === 'fulfilled') {
        setReactomePathways(reactomeResult.value);
        if (reactomeResult.value.length > 0) {
          setSelectedPathway(reactomeResult.value[0]);
        }
        hasSuccess = true;
      }

      if (!hasSuccess || (stringResult.status === 'rejected' && reactomeResult.status === 'rejected')) {
        throw new ScientificApiError(
          `No interaction networks or pathways identified for "${term}".`,
          'string',
          404,
          false,
          'Verify gene symbol (e.g. TP53, BRCA1, EGFR) or reduce the confidence threshold.'
        );
      }
    } catch (err: any) {
      if (err instanceof ScientificApiError) {
        setError(err);
      } else {
        setError(new ScientificApiError(
          err.message || 'Failed to search pathway databases.',
          'string',
          500,
          false,
          'Check network connectivity or search for another gene.'
        ));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, minConfidence);
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchTerm, minConfidence);
  };

  const handleConfidenceChange = (val: number) => {
    setMinConfidence(val);
    performSearch(searchTerm, val);
  };

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="bg-white border border-slate-300 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 border-b border-slate-200 pb-3">
          <div>
            <h1 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Network className="w-4 h-4 text-slate-700" />
              Pathway &amp; Protein Interaction Network Explorer
            </h1>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Live functional connectivity via STRING-DB functional associations and curated Reactome biochemical pathways.
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <SourceBadge source="STRING" />
            <SourceBadge source="Reactome" />
          </div>
        </div>

        {/* Search Bar & Confidence Selector */}
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter gene symbol (e.g. TP53, BRCA1, EGFR, INS)..."
              className="w-full bg-slate-50 border border-slate-300 px-3 py-1.5 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-slate-800"
            />
          </div>

          {/* Confidence Slider / Threshold */}
          <div className="flex items-center border border-slate-300 bg-slate-50 text-xs">
            <span className="px-2 py-1.5 text-slate-500 font-sans text-[10px] uppercase font-bold border-r border-slate-300">
              Confidence:
            </span>
            <button
              type="button"
              onClick={() => handleConfidenceChange(0.4)}
              className={`px-2 py-1.5 cursor-pointer font-sans text-[11px] ${
                minConfidence === 0.4 ? 'bg-slate-800 text-white font-bold' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Med (0.4)
            </button>
            <button
              type="button"
              onClick={() => handleConfidenceChange(0.7)}
              className={`px-2 py-1.5 cursor-pointer font-sans text-[11px] border-l border-slate-300 ${
                minConfidence === 0.7 ? 'bg-slate-800 text-white font-bold' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              High (0.7)
            </button>
            <button
              type="button"
              onClick={() => handleConfidenceChange(0.9)}
              className={`px-2 py-1.5 cursor-pointer font-sans text-[11px] border-l border-slate-300 ${
                minConfidence === 0.9 ? 'bg-slate-800 text-white font-bold' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Highest (0.9)
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !searchTerm.trim()}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Fetch Network</span>
          </button>
        </form>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100 flex-wrap text-[11px]">
          <span className="text-slate-500 font-medium">Standard Genes:</span>
          {PRESET_PATHWAY_GENES.map((p) => (
            <button
              key={p.symbol}
              type="button"
              onClick={() => {
                setSearchTerm(p.symbol);
                performSearch(p.symbol, minConfidence);
              }}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-mono text-[10px] cursor-pointer"
            >
              {p.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && <LoadingState message="Querying STRING-DB interaction networks and Reactome pathways..." source="STRING / Reactome" />}
      {error && !loading && <ErrorState error={error} onRetry={() => performSearch(searchTerm, minConfidence)} />}

      {/* Results Content */}
      {!loading && (stringPartners.length > 0 || reactomePathways.length > 0) && (
        <div className="space-y-4">
          {/* Section 1: STRING Protein-Protein Interaction Network */}
          <div className="bg-white border border-slate-300">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900 uppercase font-sans flex items-center gap-1.5">
                <GitFork className="w-3.5 h-3.5 text-slate-700" />
                STRING Protein-Protein Interaction Network ({searchTerm.toUpperCase()})
              </span>
              <SourceBadge
                source="STRING"
                externalUrl={`https://string-db.org/network/9606.${searchTerm.toUpperCase()}`}
              />
            </div>

            <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left: Rendered Network Diagram (6 cols) */}
              <div className="lg:col-span-6 border border-slate-300 bg-slate-50 p-2 flex flex-col items-center justify-center">
                <span className="text-[10px] uppercase font-sans text-slate-500 font-semibold mb-2 block self-start">
                  STRING Functional Association Map:
                </span>
                {stringNetworkUrl ? (
                  <div className="w-full flex flex-col items-center">
                    <img
                      src={stringNetworkUrl}
                      alt={`STRING network for ${searchTerm}`}
                      className="max-h-72 w-auto object-contain border border-slate-200 bg-white"
                      loading="lazy"
                    />
                    <a
                      href={`https://string-db.org/network/9606.${searchTerm.toUpperCase()}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-slate-700 hover:text-slate-900 hover:underline flex items-center gap-1 mt-2 font-sans"
                    >
                      <span>Open Interactive 3D Graph on STRING-DB</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <div className="text-center py-8 text-xs text-slate-500">Diagram unavailable</div>
                )}
              </div>

              {/* Right: Interaction Partners Table (6 cols) */}
              <div className="lg:col-span-6 space-y-2">
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                    Top Interactors ({stringPartners.length})
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Min score: {minConfidence}</span>
                </div>

                <div className="border border-slate-300 max-h-72 overflow-y-auto">
                  <table className="w-full text-xs text-left border-collapse font-mono">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-sans text-[10px] uppercase">
                        <th className="p-2 border-r border-slate-300">Partner</th>
                        <th className="p-2 border-r border-slate-300">Combined</th>
                        <th className="p-2 border-r border-slate-300">Experimental</th>
                        <th className="p-2 text-right">Database</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stringPartners.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50 text-[11px]">
                          <td className="p-2 border-r border-slate-200 font-bold text-slate-900">
                            {item.partnerGene}
                          </td>
                          <td className="p-2 border-r border-slate-200 font-semibold text-emerald-800">
                            {item.score.toFixed(3)}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-slate-600">
                            {item.experimentalScore > 0 ? item.experimentalScore.toFixed(3) : '-'}
                          </td>
                          <td className="p-2 text-right text-slate-600">
                            {item.databaseScore > 0 ? item.databaseScore.toFixed(3) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Reactome Curated Biological Pathways */}
          <div className="bg-white border border-slate-300">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900 uppercase font-sans flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-slate-700" />
                Reactome Curated Pathways ({reactomePathways.length} identified)
              </span>
              <SourceBadge source="Reactome" />
            </div>

            <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Pathways List (5 cols) */}
              <div className="lg:col-span-5 border border-slate-300 max-h-80 overflow-y-auto divide-y divide-slate-200 font-sans text-xs">
                {reactomePathways.length > 0 ? (
                  reactomePathways.map((pw) => {
                    const isSelected = selectedPathway?.stId === pw.stId;
                    return (
                      <div
                        key={pw.stId}
                        onClick={() => setSelectedPathway(pw)}
                        className={`p-2.5 cursor-pointer transition-colors ${
                          isSelected ? 'bg-amber-50 font-semibold' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-slate-500">{pw.stId}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{pw.species}</span>
                        </div>
                        <div className="text-slate-900 text-xs mt-0.5 leading-snug">
                          {pw.name}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No pathways returned for this entity in Reactome.
                  </div>
                )}
              </div>

              {/* Pathway Diagram Embed (7 cols) */}
              <div className="lg:col-span-7 border border-slate-300 bg-slate-50 p-3 flex flex-col justify-between">
                {selectedPathway ? (
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                      <div>
                        <div className="font-mono text-[10px] text-slate-500">{selectedPathway.stId}</div>
                        <div className="font-bold text-xs text-slate-900 font-sans">{selectedPathway.name}</div>
                      </div>
                      <a
                        href={`https://reactome.org/PathwayBrowser/#/${selectedPathway.stId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-[10px] flex items-center gap-1 font-sans"
                      >
                        <span>Pathway Browser</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>

                    <div className="flex items-center justify-center p-2 bg-white border border-slate-200 max-h-64 overflow-hidden">
                      <img
                        src={generatePathwayDiagramUrl(selectedPathway.stId)}
                        alt={`Diagram for ${selectedPathway.name}`}
                        className="max-h-60 w-auto object-contain"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-xs text-slate-500">
                    Select a pathway from the list on the left to inspect diagram.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cross References */}
          <CrossReferenceList
            geneSymbol={searchTerm.toUpperCase()}
            onNavigate={onNavigate}
          />
        </div>
      )}
    </div>
  );
};
