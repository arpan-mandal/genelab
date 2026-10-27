import React, { useState, useEffect } from 'react';
import {
  Search,
  FlaskConical,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  Activity,
  BookOpen,
} from 'lucide-react';
import {
  searchPubChemByName,
  fetchPubChemByCid,
  fetchPubChemBioassays,
  ChemicalCompound,
} from '../services/api/pubchem';
import { MolecularViewer } from '../components/research/MolecularViewer';
import { SourceBadge } from '../components/research/SourceBadge';
import { LoadingState } from '../components/research/LoadingState';
import { ErrorState } from '../components/research/ErrorState';
import { ScientificApiError } from '../services/api/apiClient';

interface CompoundExplorerProps {
  initialQuery?: string;
  onNavigate?: (tab: any, query?: string) => void;
}

const PRESET_COMPOUNDS = [
  { name: 'Aspirin', cid: 2244, desc: 'Cyclooxygenase inhibitor' },
  { name: 'Caffeine', cid: 2519, desc: 'Adenosine receptor antagonist' },
  { name: 'Doxorubicin', cid: 31703, desc: 'Topoisomerase II inhibitor' },
  { name: 'Imatinib', cid: 5291, desc: 'BCR-ABL tyrosine kinase inhibitor' },
  { name: 'Paclitaxel', cid: 36314, desc: 'Microtubule stabilizer' },
  { name: 'ATP', cid: 5957, desc: 'Adenosine triphosphate energy carrier' },
];

export const CompoundExplorer: React.FC<CompoundExplorerProps> = ({
  initialQuery = 'Aspirin',
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ScientificApiError | null>(null);

  const [compound, setCompound] = useState<ChemicalCompound | null>(null);
  const [bioassays, setBioassays] = useState<{ aid: number; name: string; activity: string }[] | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const performSearch = async (queryStr: string) => {
    if (!queryStr.trim()) return;
    setLoading(true);
    setError(null);
    setCompound(null);
    setBioassays(null);

    const term = queryStr.trim();

    try {
      let props: ChemicalCompound | null = null;

      // If purely numeric, treat as PubChem CID
      if (/^\d+$/.test(term)) {
        props = await fetchPubChemByCid(parseInt(term, 10));
      } else {
        const results = await searchPubChemByName(term);
        if (results.length > 0) {
          props = results[0];
        }
      }

      if (!props) {
        throw new ScientificApiError(
          `No chemical compound record found for "${term}" in PubChem PUG REST.`,
          'pubchem',
          404,
          false,
          'Verify chemical name spelling (e.g. Aspirin, Doxorubicin) or provide a PubChem CID.'
        );
      }

      setCompound(props);

      // Fetch associated bioassays
      try {
        const assayData = await fetchPubChemBioassays(props.cid);
        setBioassays(assayData);
      } catch {
        // Non-fatal
      }
    } catch (err: any) {
      if (err instanceof ScientificApiError) {
        setError(err);
      } else {
        setError(new ScientificApiError(
          err.message || 'Failed to search PubChem database.',
          'pubchem',
          500,
          false,
          'Check network connectivity or retry with another compound.'
        ));
      }
    } finally {
      setLoading(false);
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

  const copyToClipboard = (text: string | undefined, fieldKey: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="bg-white border border-slate-300 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 border-b border-slate-200 pb-3">
          <div>
            <h1 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-slate-700" />
              Chemical Compound &amp; Bioactivity Explorer
            </h1>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Query NIH PubChem PUG REST API for 2D structural topology, IUPAC nomenclature, SMILES strings, and bioassay profiles.
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <SourceBadge source="PubChem" />
          </div>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by compound name, CID, SMILES, or InChIKey (e.g. Aspirin, Doxorubicin, 2244)..."
              className="w-full bg-slate-50 border border-slate-300 px-3 py-1.5 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-slate-800"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !searchTerm.trim()}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Lookup Compound</span>
          </button>
        </form>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100 flex-wrap text-[11px]">
          <span className="text-slate-500 font-medium">Standard Compounds:</span>
          {PRESET_COMPOUNDS.map((p) => (
            <button
              key={p.cid}
              type="button"
              onClick={() => {
                setSearchTerm(p.name);
                performSearch(p.name);
              }}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-mono text-[10px] cursor-pointer"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && <LoadingState message="Connecting to NIH PubChem PUG REST API..." source="PubChem" />}
      {error && !loading && <ErrorState error={error} onRetry={() => performSearch(searchTerm)} />}

      {/* Compound Content Display */}
      {!loading && compound && (
        <div className="space-y-4">
          {/* Main Compound Overview Panel */}
          <div className="bg-white border border-slate-300">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-900 font-sans">
                  {compound.name.toUpperCase()}
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-xs text-slate-700 font-mono">
                  PubChem CID: {compound.cid}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('literature', compound.name)}
                    className="btn-classic text-[11px] py-0.5 flex items-center gap-1"
                  >
                    <BookOpen className="w-3 h-3 text-slate-600" />
                    <span>Search PubMed</span>
                  </button>
                )}
                <SourceBadge
                  source="PubChem"
                  externalUrl={`https://pubchem.ncbi.nlm.nih.gov/compound/${compound.cid}`}
                />
              </div>
            </div>

            {/* IUPAC Name Banner */}
            {compound.iupacName && (
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs">
                <span className="font-semibold text-slate-600 font-sans text-[11px] block">IUPAC Systematic Name:</span>
                <span className="text-slate-900 font-mono select-all text-[11px] break-all">{compound.iupacName}</span>
              </div>
            )}

            {/* 2D Structure Render + Key Properties Grid */}
            <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left: 2D Structural Topology (4 cols) */}
              <div className="lg:col-span-4 flex flex-col">
                <MolecularViewer
                  type="compound"
                  identifier={compound.cid}
                  title={`PubChem CID ${compound.cid} 2D Topology`}
                  externalUrl={`https://pubchem.ncbi.nlm.nih.gov/compound/${compound.cid}`}
                />
              </div>

              {/* Right: Physicochemical Properties (8 cols) */}
              <div className="lg:col-span-8 space-y-3 font-mono text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="bg-slate-50 p-2.5 border border-slate-200">
                    <span className="text-slate-500 block font-sans text-[10px] uppercase font-semibold">Molecular Formula</span>
                    <span className="text-slate-900 font-bold text-sm">{compound.molecularFormula}</span>
                  </div>

                  <div className="bg-slate-50 p-2.5 border border-slate-200">
                    <span className="text-slate-500 block font-sans text-[10px] uppercase font-semibold">Molecular Weight</span>
                    <span className="text-slate-900 font-bold text-sm">
                      {compound.molecularWeight ? `${compound.molecularWeight.toFixed(2)} g/mol` : 'N/A'}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 border border-slate-200">
                    <span className="text-slate-500 block font-sans text-[10px] uppercase font-semibold">XLogP3 Partition</span>
                    <span className="text-slate-900 font-bold text-sm">
                      {compound.xlogp !== undefined ? compound.xlogp : 'N/A'}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 border border-slate-200">
                    <span className="text-slate-500 block font-sans text-[10px] uppercase font-semibold">H-Bond Donors</span>
                    <span className="text-slate-900 font-bold text-sm">
                      {compound.hBondDonorCount !== undefined ? compound.hBondDonorCount : '0'}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 border border-slate-200">
                    <span className="text-slate-500 block font-sans text-[10px] uppercase font-semibold">H-Bond Acceptors</span>
                    <span className="text-slate-900 font-bold text-sm">
                      {compound.hBondAcceptorCount !== undefined ? compound.hBondAcceptorCount : '0'}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 border border-slate-200">
                    <span className="text-slate-500 block font-sans text-[10px] uppercase font-semibold">Rotatable Bonds</span>
                    <span className="text-slate-900 font-bold text-sm">
                      {compound.rotatableBondCount !== undefined ? compound.rotatableBondCount : '0'}
                    </span>
                  </div>
                </div>

                {/* SMILES & InChI Strings */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  {/* Canonical SMILES */}
                  <div className="bg-slate-50 p-2 border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase font-sans text-slate-500 font-semibold">Canonical SMILES</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(compound.canonicalSmiles, 'smiles')}
                        className="text-[10px] text-slate-600 hover:text-slate-900 flex items-center gap-1 font-sans cursor-pointer"
                      >
                        {copiedField === 'smiles' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'smiles' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-800 break-all select-all font-mono">
                      {compound.canonicalSmiles || 'N/A'}
                    </div>
                  </div>

                  {/* InChIKey */}
                  <div className="bg-slate-50 p-2 border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase font-sans text-slate-500 font-semibold">InChIKey Identifier</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(compound.inchiKey, 'inchikey')}
                        className="text-[10px] text-slate-600 hover:text-slate-900 flex items-center gap-1 font-sans cursor-pointer"
                      >
                        {copiedField === 'inchikey' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'inchikey' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-800 select-all font-mono">
                      {compound.inchiKey || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BioAssay & Pharmacology Profile */}
          <div className="bg-white border border-slate-300">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900 uppercase font-sans flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-slate-700" />
                Biological Activity &amp; BioAssay Screenings
              </span>
              <span className="text-[10px] text-slate-500 font-mono">PubChem BioAssay</span>
            </div>

            <div className="p-4">
              {bioassays ? (
                <div className="space-y-3">
                  <div className="text-xs text-slate-700">
                    Identified <strong className="text-slate-900 font-mono">{bioassays.length}</strong> active public bioassays recorded in PubChem for this entity.
                  </div>

                  {bioassays.length > 0 && (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {bioassays.map((assay) => (
                        <div key={assay.aid} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 text-xs">
                          <div className="truncate mr-2">
                            <span className="font-mono font-bold text-slate-900 mr-2">AID {assay.aid}</span>
                            <span className="text-slate-700 font-sans">{assay.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold font-sans">
                              {assay.activity}
                            </span>
                            <a
                              href={`https://pubchem.ncbi.nlm.nih.gov/bioassay/${assay.aid}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-slate-500 hover:text-slate-900 flex items-center gap-1 font-sans"
                            >
                              <span>Record</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-3 text-xs text-slate-500">
                  Retrieving bioactivity assay records from PubChem...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
