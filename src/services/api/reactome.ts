/**
 * GeneLab — Reactome Pathway Knowledgebase API Integration
 * Official API: https://reactome.org/dev/content-service
 */

import { fetchWithRetry, ApiClientOptions } from './apiClient';

const REACTOME_BASE = 'https://reactome.org/ContentService';

export interface ReactomePathway {
  stId: string; // e.g. R-HSA-5633007
  name: string;
  species: string;
  type: string;
  summation?: string;
  diagramUrl: string;
  sourceUrl: string;
}

/**
 * Searches Reactome for biological pathways associated with a gene, protein, or biological term.
 */
export async function searchReactomePathways(
  query: string,
  species = 'Homo sapiens',
  options: ApiClientOptions = {}
): Promise<ReactomePathway[]> {
  const cleanQ = query.trim();
  if (!cleanQ) return [];

  const url = `${REACTOME_BASE}/search/query?query=${encodeURIComponent(
    cleanQ
  )}&species=${encodeURIComponent(species)}&types=Pathway`;

  try {
    const data = await fetchWithRetry<any>(url, 'reactome', options);
    const results = data.results || [];
    const pathways: ReactomePathway[] = [];

    for (const group of results) {
      if (group.entries) {
        for (const entry of group.entries) {
          const stId = entry.stId || entry.id;
          const cleanName = (entry.name || 'Biological Pathway').replace(/<\/?[^>]+(>|$)/g, '');
          pathways.push({
            stId,
            name: cleanName,
            species: entry.species?.[0] || species,
            type: entry.exactType || 'Pathway',
            summation: entry.summation,
            diagramUrl: `https://reactome.org/PathwayBrowser/#/${stId}`,
            sourceUrl: `https://reactome.org/content/detail/${stId}`,
          });
        }
      }
    }

    return pathways.slice(0, 8);
  } catch {
    return [];
  }
}

export function generatePathwayDiagramUrl(stId: string): string {
  return `${REACTOME_BASE}/exporter/diagram/${encodeURIComponent(stId)}.png`;
}
