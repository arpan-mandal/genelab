/**
 * GeneLab — PubMed API Integration (NCBI E-utilities)
 * Official API: https://www.ncbi.nlm.nih.gov/books/NBK25501/
 */

import { fetchWithRetry, ApiClientOptions } from './apiClient';

const NCBI_EUTILS_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const NCBI_PARAMS = 'tool=GeneLab&email=genelab-academic%40univ.edu';

export interface PublicationRecord {
  pmid: string;
  doi?: string;
  title: string;
  authors: string[];
  firstAuthor: string;
  journal: string;
  pubDate: string;
  year: number;
  volume?: string;
  issue?: string;
  pages?: string;
  abstract?: string;
  source: 'PubMed' | 'Europe PMC';
  sourceUrl: string;
  isOpenAccess?: boolean;
}

export interface PubMedSearchParams {
  query: string;
  retmax?: number;
  retstart?: number;
  minYear?: number;
  maxYear?: number;
}

export interface PubMedSearchResult {
  count: number;
  publications: PublicationRecord[];
  query: string;
}

/**
 * Searches PubMed literature and retrieves structured publication records with abstracts.
 */
export async function searchPubMed(
  params: PubMedSearchParams,
  options: ApiClientOptions = {}
): Promise<PubMedSearchResult> {
  const { query, retmax = 10, retstart = 0, minYear, maxYear } = params;

  let formattedQuery = query.trim();
  if (minYear || maxYear) {
    const yMin = minYear || 1900;
    const yMax = maxYear || new Date().getFullYear();
    formattedQuery += ` AND (${yMin}[PDAT] : ${yMax}[PDAT])`;
  }

  // 1. ESearch for PMIDs
  const esearchUrl = `${NCBI_EUTILS_BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
    formattedQuery
  )}&retstart=${retstart}&retmax=${retmax}&sort=pub_date&retmode=json&${NCBI_PARAMS}`;

  const searchRes = await fetchWithRetry<any>(esearchUrl, 'pubmed', options);
  const result = searchRes.esearchresult || {};
  const count = parseInt(result.count || '0', 10);
  const idList: string[] = result.idlist || [];

  if (idList.length === 0) {
    return {
      count: 0,
      publications: [],
      query,
    };
  }

  // 2. ESummary for metadata
  const ids = idList.join(',');
  const esummaryUrl = `${NCBI_EUTILS_BASE}/esummary.fcgi?db=pubmed&id=${ids}&retmode=json&${NCBI_PARAMS}`;
  const sumRes = await fetchWithRetry<any>(esummaryUrl, 'pubmed', options);
  const resultDict = sumRes.result || {};

  const publications: PublicationRecord[] = [];

  for (const pmid of idList) {
    const item = resultDict[pmid];
    if (item && !item.error) {
      // Authors
      const authorList = (item.authors || []).map((a: any) => a.name || 'Unknown Author');
      const firstAuthor = authorList.length > 0 ? authorList[0] : 'Unknown';

      // DOI extraction
      let doi: string | undefined = undefined;
      if (item.articleids) {
        const doiItem = item.articleids.find((idObj: any) => idObj.idtype === 'doi');
        if (doiItem) doi = doiItem.value;
      }

      // Year extraction
      const pubDateStr = item.pubdate || item.sortpubdate || '';
      const yearMatch = pubDateStr.match(/\b(19\d\d|20\d\d)\b/);
      const year = yearMatch ? parseInt(yearMatch[0], 10) : 0;

      publications.push({
        pmid,
        doi,
        title: (item.title || 'Untitled Publication').replace(/<\/?[^>]+(>|$)/g, ''), // clean html tags
        authors: authorList,
        firstAuthor,
        journal: item.source || item.fulljournalname || 'Biomedical Journal',
        pubDate: pubDateStr,
        year,
        volume: item.volume,
        issue: item.issue,
        pages: item.pages,
        source: 'PubMed',
        sourceUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      });
    }
  }

  return {
    count,
    publications,
    query,
  };
}

/**
 * Fetches abstract text for a specific PMID using EFetch.
 */
export async function fetchPubMedAbstract(
  pmid: string,
  options: ApiClientOptions = {}
): Promise<string> {
  const url = `${NCBI_EUTILS_BASE}/efetch.fcgi?db=pubmed&id=${pmid}&rettype=abstract&retmode=text&${NCBI_PARAMS}`;
  try {
    const text = await fetchWithRetry<string>(url, 'pubmed', { ...options, timeoutMs: 10000 });
    // Strip leading header and extract main abstract block
    const cleaned = text.trim();
    return cleaned.length > 0 ? cleaned : 'Abstract text is not available for this citation.';
  } catch {
    return 'Abstract could not be retrieved from NCBI.';
  }
}
