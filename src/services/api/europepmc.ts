/**
 * GeneLab — Europe PMC RESTful Web Service Integration
 * Official API: https://europepmc.org/RestfulWebService
 */

import { fetchWithRetry, ApiClientOptions } from './apiClient';
import { PublicationRecord } from './pubmed';

const EUROPE_PMC_BASE = 'https://www.ebi.ac.uk/europepmc/webservices/rest';

export interface EuropePmcSearchOptions extends ApiClientOptions {
  pageSize?: number;
  page?: number;
  openAccessOnly?: boolean;
}

export async function searchEuropePmc(
  query: string,
  options: EuropePmcSearchOptions = {}
): Promise<{ count: number; publications: PublicationRecord[] }> {
  const { pageSize = 10, page = 1, openAccessOnly = false, ...apiOptions } = options;

  let q = query.trim();
  if (openAccessOnly) {
    q += ' AND (OPEN_ACCESS:y)';
  }

  const url = `${EUROPE_PMC_BASE}/search?query=${encodeURIComponent(
    q
  )}&format=json&pageSize=${pageSize}&page=${page}&resultType=core`;

  const res = await fetchWithRetry<any>(url, 'europepmc', apiOptions);
  const count = parseInt(res.hitCount || '0', 10);
  const resultList = res.resultList?.result || [];

  const publications: PublicationRecord[] = resultList.map((item: any) => {
    const authorList: string[] = [];
    if (item.authorList?.author) {
      for (const a of item.authorList.author) {
        if (a.fullName) authorList.push(a.fullName);
      }
    } else if (item.authorString) {
      authorList.push(...item.authorString.split(', '));
    }

    const firstAuthor = authorList.length > 0 ? authorList[0] : (item.authorString || 'Unknown');
    const pmid = item.pmid || (item.id && item.source === 'MED' ? item.id : '');
    const doi = item.doi;
    const year = item.pubYear ? parseInt(item.pubYear, 10) : 0;
    const isOpenAccess = item.isOpenAccess === 'Y';

    const sourceUrl = item.fullTextUrlList?.fullTextUrl?.[0]?.url ||
      (pmid ? `https://europepmc.org/article/MED/${pmid}` : `https://doi.org/${doi}`);

    return {
      pmid,
      doi,
      title: item.title?.replace(/<\/?[^>]+(>|$)/g, '') || 'Untitled Article',
      authors: authorList,
      firstAuthor,
      journal: item.journalTitle || item.bookOrReportDetails?.publisher || 'Life Science Publication',
      pubDate: item.firstPublicationDate || item.pubYear || '',
      year,
      volume: item.journalVolume,
      issue: item.journalIssue,
      pages: item.pageInfo,
      abstract: item.abstractText?.replace(/<\/?[^>]+(>|$)/g, ''),
      source: 'Europe PMC' as const,
      sourceUrl,
      isOpenAccess,
    };
  });

  return {
    count,
    publications,
  };
}

/**
 * Deduplicates publications between PubMed and Europe PMC by matching PMID or DOI.
 */
export function deduplicatePublications(
  list1: PublicationRecord[],
  list2: PublicationRecord[]
): PublicationRecord[] {
  const seenPmids = new Set<string>();
  const seenDois = new Set<string>();
  const combined: PublicationRecord[] = [];

  for (const item of [...list1, ...list2]) {
    if (item.pmid && seenPmids.has(item.pmid)) continue;
    if (item.doi && seenDois.has(item.doi.toLowerCase())) continue;

    if (item.pmid) seenPmids.add(item.pmid);
    if (item.doi) seenDois.add(item.doi.toLowerCase());
    combined.push(item);
  }

  return combined;
}
