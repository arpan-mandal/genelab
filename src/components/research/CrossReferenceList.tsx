import React from 'react';
import { BiologicalCrossReferences, getCrossReferences } from '../../services/api/identifierMapping';
import { NavTabId } from '../ToolNavigation';

interface CrossReferenceListProps {
  xrefs?: BiologicalCrossReferences;
  geneSymbol?: string;
  uniprotId?: string;
  onNavigate?: (tab: NavTabId, query?: string) => void;
}

export const CrossReferenceList: React.FC<CrossReferenceListProps> = ({
  xrefs: passedXrefs,
  geneSymbol,
  uniprotId,
  onNavigate,
}) => {
  const xrefs = passedXrefs || getCrossReferences(geneSymbol || uniprotId);

  if (!xrefs) return null;

  const hasAny =
    xrefs.geneSymbol ||
    xrefs.uniprotAcc ||
    (xrefs.pdbIds && xrefs.pdbIds.length > 0) ||
    (xrefs.pmids && xrefs.pmids.length > 0) ||
    (xrefs.reactomePathwayIds && xrefs.reactomePathwayIds.length > 0);

  if (!hasAny) return null;

  return (
    <div className="border border-slate-300 bg-slate-50 p-2.5 text-xs font-sans space-y-1.5">
      <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center justify-between">
        <span>Verified Cross-Database Cross-References</span>
        <span className="text-[10px] text-slate-500 font-mono">1-click navigation</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {xrefs.geneSymbol && onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('genes', xrefs.geneSymbol)}
            className="btn-classic text-[11px] py-0.5 cursor-pointer"
            title="Inspect Gene in Ensembl / NCBI Gene Explorer"
          >
            <span>Gene:</span>
            <strong className="font-mono">{xrefs.geneSymbol}</strong>
          </button>
        )}

        {xrefs.uniprotAcc && onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('proteins', xrefs.uniprotAcc)}
            className="btn-classic text-[11px] py-0.5 cursor-pointer"
            title="Inspect Protein in UniProt Explorer"
          >
            <span>UniProt:</span>
            <strong className="font-mono">{xrefs.uniprotAcc}</strong>
          </button>
        )}

        {xrefs.pdbIds && xrefs.pdbIds.length > 0 && onNavigate && (
          <div className="flex items-center gap-1">
            <span className="text-slate-500 text-[10px] uppercase font-mono font-bold">PDB:</span>
            {xrefs.pdbIds.map((pdb) => (
              <button
                key={pdb}
                type="button"
                onClick={() => onNavigate('proteins', pdb)}
                className="btn-classic text-[11px] py-0.5 font-mono cursor-pointer"
                title={`Inspect 3D structure ${pdb} in RCSB PDB`}
              >
                {pdb}
              </button>
            ))}
          </div>
        )}

        {xrefs.reactomePathwayIds && xrefs.reactomePathwayIds.length > 0 && onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('pathways', xrefs.geneSymbol || xrefs.reactomePathwayIds![0])}
            className="btn-classic text-[11px] py-0.5 cursor-pointer"
            title="Inspect Pathways on Reactome & STRING"
          >
            <span>Pathways ({xrefs.reactomePathwayIds.length})</span>
          </button>
        )}

        {xrefs.pmids && xrefs.pmids.length > 0 && onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('literature', xrefs.geneSymbol || 'sickle cell anemia')}
            className="btn-classic text-[11px] py-0.5 cursor-pointer"
            title="Search PubMed & Europe PMC Literature"
          >
            <span>Literature ({xrefs.pmids.length} citations)</span>
          </button>
        )}
      </div>
    </div>
  );
};
