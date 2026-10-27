/**
 * GeneLab — UniProt REST API Integration
 * Official API: https://www.uniprot.org/api-documentation
 */

import { fetchWithRetry, ApiClientOptions } from './apiClient';

const UNIPROT_BASE = 'https://rest.uniprot.org/uniprotkb';

export interface UniProtFeature {
  type: string;
  description: string;
  start: number;
  end: number;
}

export interface UniProtProtein {
  accession: string;
  id: string; // e.g. HBB_HUMAN
  proteinName: string;
  geneSymbol?: string;
  organism: string;
  taxId: number;
  sequence: string;
  length: number;
  massDa: number;
  isReviewed: boolean; // Swiss-Prot (reviewed) vs TrEMBL (unreviewed)
  functionSummary?: string;
  subcellularLocations: string[];
  features: UniProtFeature[];
  pdbIds: string[];
  ensemblIds: string[];
  sourceUrl: string;
}

/**
 * Searches UniProtKB by gene symbol, protein name, or keyword.
 */
export async function searchUniProt(
  query: string,
  reviewedOnly = false,
  limit = 8,
  options: ApiClientOptions = {}
): Promise<UniProtProtein[]> {
  const cleanQ = query.trim();
  if (!cleanQ) return [];

  let queryParam = cleanQ;
  if (reviewedOnly) {
    queryParam += ' AND (reviewed:true)';
  }

  const url = `${UNIPROT_BASE}/search?query=${encodeURIComponent(
    queryParam
  )}&format=json&size=${limit}`;

  const res = await fetchWithRetry<any>(url, 'uniprot', options);
  const results = res.results || [];

  return results.map(parseUniProtEntry);
}

/**
 * Fetches a single UniProt record by exact accession (e.g. 'P68871', 'P04637').
 */
export async function fetchUniProtByAccession(
  accession: string,
  options: ApiClientOptions = {}
): Promise<UniProtProtein | null> {
  const cleanAcc = accession.trim().toUpperCase();
  const url = `${UNIPROT_BASE}/${cleanAcc}.json`;

  try {
    const res = await fetchWithRetry<any>(url, 'uniprot', options);
    return parseUniProtEntry(res);
  } catch (err: any) {
    if (err.status === 404) return null;
    throw err;
  }
}

function parseUniProtEntry(item: any): UniProtProtein {
  const accession = item.primaryAccession || '';
  const id = item.uniProtkbId || accession;

  // Name resolution
  let proteinName = 'Uncharacterized protein';
  if (item.proteinDescription?.recommendedName?.fullName?.value) {
    proteinName = item.proteinDescription.recommendedName.fullName.value;
  } else if (item.proteinDescription?.submissionNames?.[0]?.fullName?.value) {
    proteinName = item.proteinDescription.submissionNames[0].fullName.value;
  }

  // Gene symbol
  const geneSymbol = item.genes?.[0]?.geneName?.value;

  // Organism
  const organism = item.organism?.scientificName || 'Unknown organism';
  const taxId = item.organism?.taxonId || 0;

  // Sequence
  const sequence = item.sequence?.value || '';
  const length = item.sequence?.length || sequence.length;
  const massDa = item.sequence?.molWeight || 0;
  const isReviewed = item.entryType === 'UniProtKB reviewed (Swiss-Prot)';

  // Function summary
  let functionSummary: string | undefined = undefined;
  const subLocations: string[] = [];

  if (item.comments) {
    for (const c of item.comments) {
      if (c.commentType === 'FUNCTION' && c.texts?.[0]?.value) {
        functionSummary = c.texts[0].value;
      }
      if (c.commentType === 'SUBCELLULAR LOCATION' && c.subcellularLocations) {
        for (const loc of c.subcellularLocations) {
          if (loc.location?.value) subLocations.push(loc.location.value);
        }
      }
    }
  }

  // Cross-references to PDB & Ensembl
  const pdbIds: string[] = [];
  const ensemblIds: string[] = [];

  if (item.uniProtKBCrossReferences) {
    for (const xr of item.uniProtKBCrossReferences) {
      if (xr.database === 'PDB' && xr.id) {
        pdbIds.push(xr.id);
      } else if (xr.database === 'Ensembl' && xr.id) {
        ensemblIds.push(xr.id);
      }
    }
  }

  // Features (domains, active sites, binding sites)
  const features: UniProtFeature[] = [];
  if (item.features) {
    for (const f of item.features.slice(0, 15)) {
      if (f.location?.start?.value && f.location?.end?.value) {
        features.push({
          type: f.type || 'Region',
          description: f.description || '',
          start: f.location.start.value,
          end: f.location.end.value,
        });
      }
    }
  }

  return {
    accession,
    id,
    proteinName,
    geneSymbol,
    organism,
    taxId,
    sequence,
    length,
    massDa,
    isReviewed,
    functionSummary,
    subcellularLocations: Array.from(new Set(subLocations)),
    features,
    pdbIds: Array.from(new Set(pdbIds)),
    ensemblIds: Array.from(new Set(ensemblIds)),
    sourceUrl: `https://www.uniprot.org/uniprotkb/${accession}/entry`,
  };
}
