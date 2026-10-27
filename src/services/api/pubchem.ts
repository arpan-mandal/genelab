/**
 * GeneLab — PubChem PUG REST API Integration
 * Official API: https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest
 */

import { fetchWithRetry, ApiClientOptions } from './apiClient';

const PUBCHEM_BASE = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';

export interface ChemicalCompound {
  cid: number;
  name: string;
  iupacName?: string;
  molecularFormula: string;
  molecularWeight: number; // g/mol
  canonicalSmiles?: string;
  isomericSmiles?: string;
  inchiKey?: string;
  charge: number;
  heavyAtomCount: number;
  hBondDonorCount: number;
  hBondAcceptorCount: number;
  rotatableBondCount: number;
  complexity?: number;
  xlogp?: number;
  tpsa?: number; // Topological polar surface area
  image2dUrl: string;
  sourceUrl: string;
}

/**
 * Searches PubChem compounds by common name, drug name, or chemical term.
 */
export async function searchPubChemByName(
  term: string,
  options: ApiClientOptions = {}
): Promise<ChemicalCompound[]> {
  const cleanTerm = term.trim();
  if (!cleanTerm) return [];

  // 1. Resolve name to CIDs (limit to top 5)
  const cidUrl = `${PUBCHEM_BASE}/compound/name/${encodeURIComponent(cleanTerm)}/cids/JSON`;
  let cids: number[] = [];

  try {
    const cidRes = await fetchWithRetry<any>(cidUrl, 'pubchem', options);
    cids = (cidRes.IdentifierList?.CID || []).slice(0, 5);
  } catch (err: any) {
    if (err.status === 404) return [];
    throw err;
  }

  if (cids.length === 0) return [];

  // 2. Fetch compound properties for resolved CIDs
  return fetchCompoundProperties(cids, cleanTerm, options);
}

/**
 * Fetches compound properties by numeric CID.
 */
export async function fetchPubChemByCid(
  cid: number,
  options: ApiClientOptions = {}
): Promise<ChemicalCompound | null> {
  const compounds = await fetchCompoundProperties([cid], '', options);
  return compounds.length > 0 ? compounds[0] : null;
}

/**
 * Fetches standardized chemical properties for a list of CIDs.
 */
export async function fetchCompoundProperties(
  cids: number[],
  searchQuery = '',
  options: ApiClientOptions = {}
): Promise<ChemicalCompound[]> {
  const cidListStr = cids.join(',');
  const propList = [
    'MolecularFormula',
    'MolecularWeight',
    'CanonicalSMILES',
    'IsomericSMILES',
    'InChIKey',
    'IUPACName',
    'Charge',
    'HeavyAtomCount',
    'HBondDonorCount',
    'HBondAcceptorCount',
    'RotatableBondCount',
    'Complexity',
    'XLogP',
    'TPSA',
    'Title',
  ].join(',');

  const propUrl = `${PUBCHEM_BASE}/compound/cid/${cidListStr}/property/${propList}/JSON`;
  const propRes = await fetchWithRetry<any>(propUrl, 'pubchem', options);
  const table = propRes.PropertyTable?.Properties || [];

  return table.map((item: any) => {
    const cid = item.CID;
    const name = item.Title || (searchQuery ? searchQuery : `CID ${cid}`);
    return {
      cid,
      name,
      iupacName: item.IUPACName,
      molecularFormula: item.MolecularFormula || '',
      molecularWeight: parseFloat(item.MolecularWeight) || 0,
      canonicalSmiles: item.CanonicalSMILES,
      isomericSmiles: item.IsomericSMILES,
      inchiKey: item.InChIKey,
      charge: item.Charge || 0,
      heavyAtomCount: item.HeavyAtomCount || 0,
      hBondDonorCount: item.HBondDonorCount || 0,
      hBondAcceptorCount: item.HBondAcceptorCount || 0,
      rotatableBondCount: item.RotatableBondCount || 0,
      complexity: item.Complexity,
      xlogp: item.XLogP ? parseFloat(item.XLogP) : undefined,
      tpsa: item.TPSA ? parseFloat(item.TPSA) : undefined,
      image2dUrl: `${PUBCHEM_BASE}/compound/cid/${cid}/PNG?image_size=300x300`,
      sourceUrl: `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`,
    };
  });
}

/**
 * Searches bioassay summary records for a PubChem CID.
 */
export async function fetchPubChemBioassays(
  cid: number,
  options: ApiClientOptions = {}
): Promise<{ aid: number; name: string; activity: string }[]> {
  const url = `${PUBCHEM_BASE}/compound/cid/${cid}/assaysummary/CSV`;
  try {
    const csv = await fetchWithRetry<string>(url, 'pubchem', { ...options, timeoutMs: 8000 });
    const lines = csv.split(/\r?\n/).slice(1, 15); // first 15 assays
    const assays: { aid: number; name: string; activity: string }[] = [];

    for (const line of lines) {
      const parts = line.split(',');
      if (parts.length >= 3) {
        const aid = parseInt(parts[0], 10);
        if (!isNaN(aid)) {
          assays.push({
            aid,
            name: parts[2]?.replace(/"/g, '') || `Assay AID ${aid}`,
            activity: parts[3]?.replace(/"/g, '') || 'Active',
          });
        }
      }
    }
    return assays;
  } catch {
    return [];
  }
}
