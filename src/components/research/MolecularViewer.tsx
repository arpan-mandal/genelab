import React, { useState } from 'react';
import { ExternalLink, Maximize2, Download } from 'lucide-react';

interface MolecularViewerProps {
  pdbId?: string;
  compoundCid?: number;
  compoundName?: string;
  structureTitle?: string;
  type?: 'pdb' | 'compound';
  identifier?: string | number;
  title?: string;
  externalUrl?: string;
}

export const MolecularViewer: React.FC<MolecularViewerProps> = ({
  pdbId,
  compoundCid,
  compoundName,
  structureTitle,
  type,
  identifier,
  title,
  externalUrl,
}) => {
  const [loadInteractive3D, setLoadInteractive3D] = useState(false);

  // Normalize inputs
  const effectivePdbId = pdbId || (type === 'pdb' && typeof identifier === 'string' ? identifier : undefined);
  const effectiveCompoundCid = compoundCid || (type === 'compound' && identifier ? Number(identifier) : undefined);
  const displayTitle = structureTitle || title;

  // 1. If PDB structure
  if (effectivePdbId) {
    const cleanId = effectivePdbId.toUpperCase();
    const rcsbViewerUrl = externalUrl || `https://www.rcsb.org/3d-view/${cleanId}`;
    const rcsbDownloadUrl = `https://files.rcsb.org/download/${cleanId}.pdb`;

    return (
      <div className="border border-slate-300 bg-white p-3 space-y-2 text-xs font-sans">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
          <div>
            <span className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
              3D Macromolecular Structure ({cleanId})
            </span>
            {displayTitle && (
              <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">{displayTitle}</p>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <a
              href={rcsbDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-classic text-[11px] py-0.5"
              title="Download coordinate file from RCSB PDB"
            >
              <Download className="w-3 h-3 text-slate-600" />
              <span>Download .PDB</span>
            </a>
            <a
              href={rcsbViewerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-classic text-[11px] py-0.5"
              title="Open full 3D interactive viewer on RCSB PDB"
            >
              <ExternalLink className="w-3 h-3 text-slate-600" />
              <span>RCSB 3D View</span>
            </a>
          </div>
        </div>

        {/* Embedded Mol* View or Thumbnail */}
        <div className="bg-slate-900 border border-slate-400 relative h-72 flex items-center justify-center overflow-hidden">
          {loadInteractive3D ? (
            <iframe
              src={`https://molstar.org/viewer/?pdb=${cleanId}`}
              title={`3D Mol* view for ${cleanId}`}
              className="w-full h-full border-0"
              loading="lazy"
            />
          ) : (
            <div className="text-center p-4 space-y-3">
              <div className="space-y-1">
                <span className="font-mono text-emerald-400 font-bold block text-sm">
                  {cleanId} — Atomic Coordinates Available
                </span>
                <p className="text-[11px] text-slate-300 max-w-md mx-auto">
                  Interactive 3D molecular visualization is powered by Mol* (Macromolecular Structure WebGL Viewer).
                </p>
              </div>

              <button
                type="button"
                onClick={() => setLoadInteractive3D(true)}
                className="btn-primary text-xs py-1.5 px-4 font-sans cursor-pointer inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Launch Interactive 3D WebGL Viewer</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Source: RCSB Protein Data Bank (PDB)</span>
          <span>Format: PDBx/mmCIF &amp; PDB</span>
        </div>
      </div>
    );
  }

  // 2. If Chemical Compound (PubChem)
  if (effectiveCompoundCid) {
    const pubchemImgUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${effectiveCompoundCid}/PNG?image_size=300x300`;
    const pubchemRecordUrl = externalUrl || `https://pubchem.ncbi.nlm.nih.gov/compound/${effectiveCompoundCid}`;

    return (
      <div className="border border-slate-300 bg-white p-3 space-y-2 text-xs font-sans">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
          <div>
            <span className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
              2D Chemical Structural Topology (CID: {effectiveCompoundCid})
            </span>
            {(compoundName || displayTitle) && (
              <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">{compoundName || displayTitle}</p>
            )}
          </div>

          <a
            href={pubchemRecordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-classic text-[11px] py-0.5"
            title="Open official record on PubChem"
          >
            <ExternalLink className="w-3 h-3 text-slate-600" />
            <span>PubChem Record</span>
          </a>
        </div>

        <div className="bg-white border border-slate-200 flex items-center justify-center p-4 min-h-[220px]">
          <img
            src={pubchemImgUrl}
            alt={displayTitle || `Compound CID ${effectiveCompoundCid}`}
            className="max-h-52 max-w-full object-contain"
            loading="lazy"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Source: NIH PubChem PUG REST</span>
          <span>Type: 2D Skeletal Formula</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-500 font-mono">
      No macromolecular or chemical identifier provided.
    </div>
  );
};
