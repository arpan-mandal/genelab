/**
 * GeneLab — NCBI E-utilities API Integration
 * Official API: https://www.ncbi.nlm.nih.gov/home/develop/api/
 * Complies with NCBI usage guidelines (tool=GeneLab, email specified, <= 3 req/s without key).
 */

import { fetchWithRetry, ApiClientOptions } from './apiClient';

const NCBI_EUTILS_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const NCBI_PARAMS = 'tool=GeneLab&email=genelab-academic%40univ.edu';

export interface NcbiSearchResult {
  count: number;
  idList: string[];
  db: string;
  query: string;
}

export interface NcbiNucleotideSummary {
  uid: string;
  accession: string;
  title: string;
  organism: string;
  taxId: number;
  length: number;
  updateDate: string;
  molType: string;
  sourceUrl: string;
}

export interface NcbiGeneSummary {
  uid: string;
  name: string; // Symbol
  description: string;
  organism: {
    scientificName: string;
    commonName?: string;
    taxId: number;
  };
  chromosome?: string;
  mapLocation?: string;
  summary?: string;
  sourceUrl: string;
}

export interface NcbiProteinSummary {
  uid: string;
  accession: string;
  title: string;
  organism: string;
  length: number;
  updateDate: string;
  sourceUrl: string;
}

/**
 * Searches NCBI database (nuccore, protein, gene, pubmed).
 */
export async function searchNcbi(
  db: 'nuccore' | 'protein' | 'gene' | 'taxonomy',
  term: string,
  retmax = 10,
  options: ApiClientOptions = {}
): Promise<NcbiSearchResult> {
  const encTerm = encodeURIComponent(term.trim());
  const url = `${NCBI_EUTILS_BASE}/esearch.fcgi?db=${db}&term=${encTerm}&retmode=json&retmax=${retmax}&sort=relevance&${NCBI_PARAMS}`;

  const res = await fetchWithRetry<any>(url, 'ncbi', options);
  const result = res.esearchresult || {};

  return {
    count: parseInt(result.count || '0', 10),
    idList: result.idlist || [],
    db,
    query: term,
  };
}

/**
 * Retrieves nucleotide summaries by UID list.
 */
export async function fetchNucleotideSummaries(
  idList: string[],
  options: ApiClientOptions = {}
): Promise<NcbiNucleotideSummary[]> {
  if (idList.length === 0) return [];
  const ids = idList.join(',');
  const url = `${NCBI_EUTILS_BASE}/esummary.fcgi?db=nuccore&id=${ids}&retmode=json&${NCBI_PARAMS}`;

  const res = await fetchWithRetry<any>(url, 'ncbi', options);
  const resultObj = res.result || {};
  const summaries: NcbiNucleotideSummary[] = [];

  for (const id of idList) {
    const item = resultObj[id];
    if (item && !item.error) {
      const acc = item.caption || item.accessionversion || item.accession || id;
      summaries.push({
        uid: id,
        accession: acc,
        title: item.title || 'Nucleotide sequence record',
        organism: item.organism || 'Unknown organism',
        taxId: item.taxid || 0,
        length: item.slen || 0,
        updateDate: item.updatedate || '',
        molType: item.moltype || 'DNA',
        sourceUrl: `https://www.ncbi.nlm.nih.gov/nuccore/${acc}`,
      });
    }
  }

  return summaries;
}

/**
 * Fetches FASTA sequence for a specific accession or UID from NCBI.
 */
export async function fetchNcbiFasta(
  accessionOrId: string,
  db: 'nuccore' | 'protein' = 'nuccore',
  options: ApiClientOptions = {}
): Promise<{ header: string; sequence: string; rawFasta: string }> {
  const cleanId = accessionOrId.trim();
  const url = `${NCBI_EUTILS_BASE}/efetch.fcgi?db=${db}&id=${encodeURIComponent(cleanId)}&rettype=fasta&retmode=text&${NCBI_PARAMS}`;

  const fastaText = await fetchWithRetry<string>(url, 'ncbi', { ...options, timeoutMs: 15000 });
  const lines = fastaText.split(/\r?\n/);
  let header = '';
  const seqLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('>')) {
      if (!header) header = trimmed.substring(1).trim();
    } else if (trimmed.length > 0) {
      seqLines.push(trimmed);
    }
  }

  return {
    header,
    sequence: seqLines.join('').toUpperCase(),
    rawFasta: fastaText,
  };
}

/**
 * Searches NCBI Gene and fetches summaries.
 */
export async function searchNcbiGenes(
  query: string,
  retmax = 8,
  options: ApiClientOptions = {}
): Promise<NcbiGeneSummary[]> {
  const searchRes = await searchNcbi('gene', query, retmax, options);
  if (searchRes.idList.length === 0) return [];

  const ids = searchRes.idList.join(',');
  const url = `${NCBI_EUTILS_BASE}/esummary.fcgi?db=gene&id=${ids}&retmode=json&${NCBI_PARAMS}`;
  const res = await fetchWithRetry<any>(url, 'ncbi', options);
  const resultObj = res.result || {};

  const geneList: NcbiGeneSummary[] = [];
  for (const id of searchRes.idList) {
    const item = resultObj[id];
    if (item && !item.error) {
      geneList.push({
        uid: id,
        name: item.name || '',
        description: item.description || '',
        organism: {
          scientificName: item.organism?.scientificname || 'Homo sapiens',
          commonName: item.organism?.commonname,
          taxId: item.organism?.taxid || 9606,
        },
        chromosome: item.chromosome,
        mapLocation: item.maplocation,
        summary: item.summary,
        sourceUrl: `https://www.ncbi.nlm.nih.gov/gene/${id}`,
      });
    }
  }

  return geneList;
}

/**
 * Searches NCBI Protein records.
 */
export async function searchNcbiProteins(
  query: string,
  retmax = 8,
  options: ApiClientOptions = {}
): Promise<NcbiProteinSummary[]> {
  const searchRes = await searchNcbi('protein', query, retmax, options);
  if (searchRes.idList.length === 0) return [];

  const ids = searchRes.idList.join(',');
  const url = `${NCBI_EUTILS_BASE}/esummary.fcgi?db=protein&id=${ids}&retmode=json&${NCBI_PARAMS}`;
  const res = await fetchWithRetry<any>(url, 'ncbi', options);
  const resultObj = res.result || {};

  const list: NcbiProteinSummary[] = [];
  for (const id of searchRes.idList) {
    const item = resultObj[id];
    if (item && !item.error) {
      const acc = item.caption || item.accessionversion || id;
      list.push({
        uid: id,
        accession: acc,
        title: item.title || 'Protein record',
        organism: item.organism || 'Unknown',
        length: item.slen || 0,
        updateDate: item.updatedate || '',
        sourceUrl: `https://www.ncbi.nlm.nih.gov/protein/${acc}`,
      });
    }
  }

  return list;
}
