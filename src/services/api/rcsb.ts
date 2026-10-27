/**
 * GeneLab — RCSB Protein Data Bank (PDB) API Integration
 * Official API: https://www2.rcsb.org/docs/programmatic-access/web-apis-overview
 */

import { fetchWithRetry, ApiClientOptions } from './apiClient';

const RCSB_DATA_BASE = 'https://data.rcsb.org/rest/v1';

export interface PdbStructure {
  pdbId: string;
  title: string;
  experimentalMethod: string;
  resolution?: number; // Angstroms (Å)
  releaseDate?: string;
  authors: string[];
  polymerEntitiesCount: number;
  molecularWeightEstimatedDa?: number;
  citation?: {
    title?: string;
    journal?: string;
    year?: number;
    doi?: string;
    pmid?: string;
  };
  sourceUrl: string;
  view3dUrl: string;
}

/**
 * Searches RCSB PDB for structures matching a query (e.g., protein name, gene, or keyword).
 */
export async function searchPdbStructures(
  query: string,
  limit = 6,
  options: ApiClientOptions = {}
): Promise<PdbStructure[]> {
  const cleanQ = query.trim();
  if (!cleanQ) return [];

  // Check if query is directly a 4-character PDB ID (e.g. "4HHB", "1TUP")
  if (/^[0-9][a-zA-Z0-9]{3}$/i.test(cleanQ)) {
    const single = await fetchPdbStructureById(cleanQ.toUpperCase(), options);
    return single ? [single] : [];
  }

  // Otherwise, use RCSB full-text search
  const searchPayload = {
    query: {
      type: 'terminal',
      service: 'full_text',
      parameters: {
        value: cleanQ,
      },
    },
    return_type: 'entry',
    request_options: {
      paginate: {
        start: 0,
        rows: limit,
      },
    },
  };

  try {
    const res = await fetch('https://search.rcsb.org/rcsbsearch/v2/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchPayload),
    });

    if (!res.ok) return [];
    const json = await res.json();
    const resultSet = json.result_set || [];
    const pdbIds: string[] = resultSet.map((r: any) => r.identifier);

    if (pdbIds.length === 0) return [];

    // Fetch core details for each PDB entry
    const structures: PdbStructure[] = [];
    for (const pdbId of pdbIds) {
      try {
        const item = await fetchPdbStructureById(pdbId, options);
        if (item) structures.push(item);
      } catch {
        // Continue on individual structure failure
      }
    }
    return structures;
  } catch {
    return [];
  }
}

/**
 * Retrieves core metadata for a single PDB structure by its 4-character ID.
 */
export async function fetchPdbStructureById(
  pdbId: string,
  options: ApiClientOptions = {}
): Promise<PdbStructure | null> {
  const cleanId = pdbId.trim().toUpperCase();
  const url = `${RCSB_DATA_BASE}/core/entry/${encodeURIComponent(cleanId)}`;

  try {
    const data = await fetchWithRetry<any>(url, 'rcsb', options);

    const title = data.struct?.title || `Macromolecular Structure ${cleanId}`;
    const method = data.exptl?.[0]?.method || 'X-RAY DIFFRACTION';
    const resolution = data.rcsb_entry_info?.resolution_combined?.[0]
      ? parseFloat(data.rcsb_entry_info.resolution_combined[0])
      : undefined;

    const releaseDate = data.rcsb_accession_info?.initial_release_date || '';
    const authors = (data.audit_author || []).map((a: any) => a.name).slice(0, 5);

    const primaryCit = data.citation?.[0];
    const citation = primaryCit
      ? {
          title: primaryCit.title,
          journal: primaryCit.journal_abbrev || primaryCit.journal_id_ASTM,
          year: primaryCit.year,
          doi: primaryCit.pdbx_database_id_DOI,
          pmid: primaryCit.pdbx_database_id_PubMed,
        }
      : undefined;

    return {
      pdbId: cleanId,
      title,
      experimentalMethod: method,
      resolution,
      releaseDate,
      authors,
      polymerEntitiesCount: data.rcsb_entry_info?.polymer_entity_count || 1,
      molecularWeightEstimatedDa: data.rcsb_entry_info?.molecular_weight
        ? Math.round(data.rcsb_entry_info.molecular_weight * 1000)
        : undefined,
      citation,
      sourceUrl: `https://www.rcsb.org/structure/${cleanId}`,
      view3dUrl: `https://www.rcsb.org/3d-view/${cleanId}`,
    };
  } catch (err: any) {
    if (err.status === 404) return null;
    throw err;
  }
}
