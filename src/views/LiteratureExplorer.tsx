import React, { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Copy,
  Check,
  FileText,
} from 'lucide-react';
import { searchPubMed, fetchPubMedAbstract, PublicationRecord } from '../services/api/pubmed';
import { searchEuropePmc, deduplicatePublications } from '../services/api/europepmc';
import { SourceBadge } from '../components/research/SourceBadge';
import { LoadingState } from '../components/research/LoadingState';
import { ErrorState } from '../components/research/ErrorState';
import { ScientificApiError } from '../services/api/apiClient';

interface LiteratureExplorerProps {
  initialQuery?: string;
  onNavigate?: (tab: any, query?: string) => void;
}

const PRESET_QUERIES = [
  'sickle cell anemia HBB',
  'TP53 tumor suppressor mutation',
  'BRCA1 homologous recombination',
  'insulin receptor signaling pathway',
  'CRISPR Cas9 base editing',
  'EGFR tyrosine kinase inhibitors lung cancer',
];

export const LiteratureExplorer: React.FC<LiteratureExplorerProps> = ({
  initialQuery = 'sickle cell anemia HBB',
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [yearFilter, setYearFilter] = useState<'all' | '5' | '10'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ScientificApiError | null>(null);

  const [articles, setArticles] = useState<PublicationRecord[]>([]);
  const [expandedAbstracts, setExpandedAbstracts] = useState<Record<string, boolean>>({});
  const [abstractTexts, setAbstractTexts] = useState<Record<string, string>>({});
  const [abstractLoading, setAbstractLoading] = useState<Record<string, boolean>>({});
  const [copiedPmid, setCopiedPmid] = useState<string | null>(null);

  const performSearch = async (queryText: string, years: 'all' | '5' | '10') => {
    if (!queryText.trim()) return;
    setLoading(true);
    setError(null);
    setArticles([]);

    const currentYear = new Date().getFullYear();
    let minYear: number | undefined;
    if (years === '5') minYear = currentYear - 5;
    else if (years === '10') minYear = currentYear - 10;

    try {
      // Parallel query PubMed and Europe PMC
      const [pubmedRes, europePmcRes] = await Promise.allSettled([
        searchPubMed({ query: queryText.trim(), retmax: 15, minYear }),
        searchEuropePmc(queryText.trim(), { pageSize: 15 }),
      ]);

      const pubmedList: PublicationRecord[] =
        pubmedRes.status === 'fulfilled' ? pubmedRes.value.publications : [];
      const europePmcList: PublicationRecord[] =
        europePmcRes.status === 'fulfilled' ? europePmcRes.value.publications : [];

      const combined = deduplicatePublications(pubmedList, europePmcList);

      if (combined.length === 0) {
        throw new ScientificApiError(
          `No publications found matching query "${queryText}".`,
          'pubmed',
          404,
          false,
          'Try broadening your search terms or removing year filters.'
        );
      }

      setArticles(combined);
    } catch (err: any) {
      if (err instanceof ScientificApiError) {
        setError(err);
      } else {
        setError(new ScientificApiError(
          err.message || 'Failed to search literature databases.',
          'pubmed',
          500,
          false,
          'Check network connectivity or retry in a few moments.'
        ));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, yearFilter);
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchTerm, yearFilter);
  };

  const handleYearFilterChange = (filter: 'all' | '5' | '10') => {
    setYearFilter(filter);
    performSearch(searchTerm, filter);
  };

  const toggleAbstract = async (pmid: string) => {
    const isCurrentlyExpanded = !!expandedAbstracts[pmid];
    setExpandedAbstracts(prev => ({ ...prev, [pmid]: !isCurrentlyExpanded }));

    // If not already fetched and is expanding, fetch abstract from NCBI E-utilities
    if (!isCurrentlyExpanded && !abstractTexts[pmid] && pmid) {
      setAbstractLoading(prev => ({ ...prev, [pmid]: true }));
      try {
        const text = await fetchPubMedAbstract(pmid);
        setAbstractTexts(prev => ({ ...prev, [pmid]: text || 'Abstract text not available in public index.' }));
      } catch {
        setAbstractTexts(prev => ({ ...prev, [pmid]: 'Failed to retrieve abstract from NCBI.' }));
      } finally {
        setAbstractLoading(prev => ({ ...prev, [pmid]: false }));
      }
    }
  };

  const handleCopyCitation = (pub: PublicationRecord) => {
    const authors = pub.authors.length > 0 ? `${pub.authors.join(', ')}. ` : '';
    const citation = `${authors}"${pub.title}" ${pub.journal} (${pub.pubDate}). PMID: ${pub.pmid}${pub.doi ? `; DOI: ${pub.doi}` : ''}.`;
    navigator.clipboard.writeText(citation);
    setCopiedPmid(pub.pmid);
    setTimeout(() => setCopiedPmid(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header and Search Box */}
      <div className="bg-white border border-slate-300 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 border-b border-slate-200 pb-3">
          <div>
            <h1 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-700" />
              Scientific Literature Explorer
            </h1>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Live federated search across NCBI PubMed E-utilities and Europe PMC for peer-reviewed citations and open-access abstracts.
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <SourceBadge source="PubMed" />
            <SourceBadge source="Europe PMC" />
          </div>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[260px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by keywords, author, PMID, or DOI (e.g. TP53 mutation, CRISPR Cas9)..."
              className="w-full bg-slate-50 border border-slate-300 px-3 py-1.5 text-xs text-slate-900 font-sans focus:bg-white focus:outline-none focus:border-slate-800"
            />
          </div>

          {/* Year Filter Buttons */}
          <div className="flex items-center border border-slate-300 bg-slate-50 text-xs">
            <button
              type="button"
              onClick={() => handleYearFilterChange('all')}
              className={`px-2.5 py-1.5 font-sans cursor-pointer ${
                yearFilter === 'all' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => handleYearFilterChange('5')}
              className={`px-2.5 py-1.5 font-sans border-l border-slate-300 cursor-pointer ${
                yearFilter === '5' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Last 5 Yrs
            </button>
            <button
              type="button"
              onClick={() => handleYearFilterChange('10')}
              className={`px-2.5 py-1.5 font-sans border-l border-slate-300 cursor-pointer ${
                yearFilter === '10' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Last 10 Yrs
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !searchTerm.trim()}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Search Literature</span>
          </button>
        </form>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100 flex-wrap text-[11px]">
          <span className="text-slate-500 font-medium">Example Queries:</span>
          {PRESET_QUERIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => {
                setSearchTerm(q);
                performSearch(q, yearFilter);
              }}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-[10px] cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && <LoadingState message="Federating search across NCBI PubMed & Europe PMC..." source="PubMed / Europe PMC" />}
      {error && !loading && <ErrorState error={error} onRetry={() => performSearch(searchTerm, yearFilter)} />}

      {/* Publications List */}
      {!loading && articles.length > 0 && (
        <div className="space-y-3">
          <div className="bg-slate-200 border border-slate-300 px-3 py-1.5 text-xs text-slate-800 flex items-center justify-between font-mono">
            <span>Query Results: {articles.length} peer-reviewed articles</span>
            <span className="text-[11px] text-slate-600 font-sans">Sorted by relevance &amp; publication date</span>
          </div>

          <div className="space-y-2">
            {articles.map((pub, idx) => {
              const isExpanded = !!expandedAbstracts[pub.pmid];
              const isAbstractLoading = !!abstractLoading[pub.pmid];
              const isCopied = copiedPmid === pub.pmid;

              return (
                <div key={pub.pmid || idx} className="bg-white border border-slate-300 p-3 hover:border-slate-400 transition-colors">
                  {/* Article Title & Source Badges */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                    <div className="flex-1">
                      <a
                        href={pub.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pub.pmid}/` : `https://doi.org/${pub.doi}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-slate-900 hover:text-slate-700 hover:underline leading-snug flex items-baseline gap-1"
                      >
                        <span>{pub.title}</span>
                        <ExternalLink className="w-2.5 h-2.5 inline shrink-0 text-slate-400" />
                      </a>

                      {/* Authors & Journal line */}
                      <div className="text-[11px] text-slate-600 mt-1 font-sans">
                        <span className="text-slate-800 font-medium">
                          {pub.authors.length > 0 ? (
                            pub.authors.length > 5
                              ? `${pub.authors.slice(0, 4).join(', ')}, et al.`
                              : pub.authors.join(', ')
                          ) : 'Authors unlisted'}
                        </span>
                        <span className="mx-1 text-slate-400">•</span>
                        <span className="italic">{pub.journal || 'Journal'}</span>
                        {pub.pubDate && (
                          <>
                            <span className="mx-1 text-slate-400">•</span>
                            <span>{pub.pubDate}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right Badges */}
                    <div className="flex items-center gap-1.5 shrink-0 self-start">
                      {pub.isOpenAccess && (
                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-sans font-bold">
                          OPEN ACCESS
                        </span>
                      )}
                      <SourceBadge
                        source={pub.source === 'Europe PMC' ? 'Europe PMC' : 'PubMed'}
                        externalUrl={pub.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pub.pmid}/` : undefined}
                      />
                    </div>
                  </div>

                  {/* ID Pills & Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px] font-mono">
                    <div className="flex items-center gap-3">
                      {pub.pmid && (
                        <span>
                          <span className="text-slate-500">PMID: </span>
                          <a
                            href={`https://pubmed.ncbi.nlm.nih.gov/${pub.pmid}/`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-900 font-bold hover:underline"
                          >
                            {pub.pmid}
                          </a>
                        </span>
                      )}

                      {pub.doi && (
                        <span>
                          <span className="text-slate-500">DOI: </span>
                          <a
                            href={`https://doi.org/${pub.doi}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-700 hover:underline"
                          >
                            {pub.doi}
                          </a>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 font-sans">
                      {onNavigate && (
                        <button
                          type="button"
                          onClick={() => onNavigate('genes', 'HBB')}
                          className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 text-[10px] cursor-pointer"
                        >
                          Find Genes →
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleCopyCitation(pub)}
                        className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopied ? 'Copied' : 'Cite'}</span>
                      </button>

                      {pub.pmid && (
                        <button
                          type="button"
                          onClick={() => toggleAbstract(pub.pmid)}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-[10px] font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3 h-3 text-slate-600" />
                          <span>{isExpanded ? 'Hide Abstract' : 'Read Abstract'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandable Abstract */}
                  {isExpanded && (
                    <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans">
                      {isAbstractLoading ? (
                        <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Retrieving complete abstract from NCBI PubMed...</span>
                        </div>
                      ) : (
                        <p>{abstractTexts[pub.pmid] || 'Abstract text not found.'}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
