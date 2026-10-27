/**
 * GeneLab — Ensembl REST API Integration
 * Official API: https://rest.ensembl.org/
 */

import { fetchWithRetry, ApiClientOptions } from './apiClient';

const ENSEMBL_BASE = 'https://rest.ensembl.org';

export interface EnsemblTranscript {
  id: string;
  biotype: string;
  isCanonical: boolean;
  length?: number;
  start: number;
  end: number;
  strand: number;
}

export interface EnsemblGene {
  id: string; // ENSG...
  symbol: string;
  description?: string;
  species: string;
  biotype: string;
  seqRegionName: string; // Chromosome (e.g. "11")
  start: number;
  end: number;
  strand: number; // 1 or -1
  assemblyName: string;
  transcripts: EnsemblTranscript[];
  sourceUrl: string;
}

export const SUPPORTED_ENSEMBL_SPECIES = [
  { id: 'homo_sapiens', name: 'Homo sapiens (Human)' },
  { id: 'mus_musculus', name: 'Mus musculus (Mouse)' },
  { id: 'rattus_norvegicus', name: 'Rattus norvegicus (Rat)' },
  { id: 'danio_rerio', name: 'Danio rerio (Zebrafish)' },
  { id: 'drosophila_melanogaster', name: 'Drosophila melanogaster (Fruit fly)' },
  { id: 'caenorhabditis_elegans', name: 'Caenorhabditis elegans (Nematode)' },
  { id: 'saccharomyces_cerevisiae', name: 'Saccharomyces cerevisiae (Yeast)' },
  { id: 'arabidopsis_thaliana', name: 'Arabidopsis thaliana (Thale cress)' },
];

/**
 * Looks up gene metadata by symbol for a specific organism.
 */
export async function lookupEnsemblSymbol(
  symbol: string,
  species = 'homo_sapiens',
  options: ApiClientOptions = {}
): Promise<EnsemblGene | null> {
  const cleanSymbol = symbol.trim().toUpperCase();
  const url = `${ENSEMBL_BASE}/lookup/symbol/${encodeURIComponent(species)}/${encodeURIComponent(
    cleanSymbol
  )}?expand=1;content-type=application/json`;

  try {
    const data = await fetchWithRetry<any>(url, 'ensembl', options, {
      'Content-Type': 'application/json',
    });
    return parseEnsemblGene(data);
  } catch (err: any) {
    if (err.status === 404 || err.message?.includes('not found')) {
      return null;
    }
    throw err;
  }
}

/**
 * Looks up gene metadata by Ensembl Gene ID (ENSG...).
 */
export async function lookupEnsemblId(
  id: string,
  options: ApiClientOptions = {}
): Promise<EnsemblGene | null> {
  const cleanId = id.trim();
  const url = `${ENSEMBL_BASE}/lookup/id/${encodeURIComponent(
    cleanId
  )}?expand=1;content-type=application/json`;

  try {
    const data = await fetchWithRetry<any>(url, 'ensembl', options, {
      'Content-Type': 'application/json',
    });
    return parseEnsemblGene(data);
  } catch (err: any) {
    if (err.status === 404) return null;
    throw err;
  }
}

/**
 * Fetches the genomic nucleotide sequence for an Ensembl gene or transcript ID.
 */
export async function fetchEnsemblSequence(
  id: string,
  type: 'genomic' | 'cds' | 'cdna' = 'genomic',
  options: ApiClientOptions = {}
): Promise<{ id: string; sequence: string; desc?: string }> {
  const url = `${ENSEMBL_BASE}/sequence/id/${encodeURIComponent(
    id
  )}?type=${type};content-type=application/json`;

  const data = await fetchWithRetry<any>(url, 'ensembl', options, {
    'Content-Type': 'application/json',
  });

  return {
    id: data.id || id,
    sequence: (data.seq || '').toUpperCase(),
    desc: data.desc,
  };
}

function parseEnsemblGene(data: any): EnsemblGene {
  const id = data.id;
  const symbol = data.display_name || id;
  const species = data.species || 'homo_sapiens';

  const canonicalId = data.canonical_transcript?.split('.')?.[0];
  const transcripts: EnsemblTranscript[] = (data.Transcript || []).map((t: any) => ({
    id: t.id,
    biotype: t.biotype || 'protein_coding',
    isCanonical: t.id === canonicalId || t.is_canonical === 1,
    length: t.length || (t.end - t.start + 1),
    start: t.start,
    end: t.end,
    strand: t.strand,
  }));

  // Sort canonical transcript first
  transcripts.sort((a, b) => (b.isCanonical ? 1 : 0) - (a.isCanonical ? 1 : 0));

  return {
    id,
    symbol,
    description: data.description?.replace(/\s*\[Source:.*?\]/, ''),
    species,
    biotype: data.biotype || 'protein_coding',
    seqRegionName: data.seq_region_name || '',
    start: data.start || 0,
    end: data.end || 0,
    strand: data.strand || 1,
    assemblyName: data.assembly_name || 'GRCh38',
    transcripts,
    sourceUrl: `https://www.ensembl.org/${species}/Gene/Summary?g=${id}`,
  };
}
