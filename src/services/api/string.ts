/**
 * GeneLab — STRING Database API Integration
 * Official API: https://string-db.org/help/api/
 */

import { fetchWithRetry, ApiClientOptions } from './apiClient';

const STRING_BASE = 'https://string-db.org/api';

export interface StringInteractionPartner {
  partnerGene: string;
  partnerProteinId: string;
  score: number; // Combined confidence score 0.0 to 1.0
  experimentalScore: number;
  databaseScore: number;
  textminingScore: number;
  coexpressionScore: number;
  sourceUrl: string;
}

export type StringInteraction = StringInteractionPartner;

export interface StringNetworkResult {
  queryGene: string;
  speciesTaxId: number;
  partners: StringInteractionPartner[];
  networkImageUrl: string;
  sourceUrl: string;
}

/**
 * Searches STRING for interaction partners of a given protein/gene identifier.
 */
export async function fetchStringInteractions(
  proteinIdentifier: string,
  speciesTaxId = 9606, // Default: Homo sapiens
  limit = 10,
  options: ApiClientOptions = {}
): Promise<StringNetworkResult | null> {
  const cleanId = proteinIdentifier.trim();
  if (!cleanId) return null;

  const url = `${STRING_BASE}/json/interaction_partners?identifiers=${encodeURIComponent(
    cleanId
  )}&species=${speciesTaxId}&limit=${limit}&caller_identity=GeneLab_Workbench`;

  try {
    const data = await fetchWithRetry<any[]>(url, 'string', options);
    if (!Array.isArray(data) || data.length === 0) return null;

    const partners: StringInteractionPartner[] = data.map((item: any) => ({
      partnerGene: item.preferredName_B || item.stringId_B || 'Unknown',
      partnerProteinId: item.stringId_B || '',
      score: item.score || 0,
      experimentalScore: item.escore || 0,
      databaseScore: item.dscore || 0,
      textminingScore: item.ascore || 0,
      coexpressionScore: item.ascore || 0,
      sourceUrl: `https://string-db.org/network/${speciesTaxId}.${item.preferredName_B}`,
    }));

    // Sort partners by highest confidence score descending
    partners.sort((a, b) => b.score - a.score);

    const networkImageUrl = `${STRING_BASE}/image/network?identifiers=${encodeURIComponent(
      cleanId
    )}&species=${speciesTaxId}&add_white_nodes=5&network_flavor=confidence`;

    return {
      queryGene: cleanId,
      speciesTaxId,
      partners,
      networkImageUrl,
      sourceUrl: `https://string-db.org/network/${speciesTaxId}.${cleanId}`,
    };
  } catch (err: any) {
    if (err.status === 404) return null;
    throw err;
  }
}

export function generateNetworkImageUrl(
  proteinIdentifier: string,
  speciesTaxId = 9606,
  minConfidence = 0.4
): string {
  const cleanId = proteinIdentifier.trim();
  const reqScore = Math.round(minConfidence * 1000);
  return `${STRING_BASE}/image/network?identifiers=${encodeURIComponent(
    cleanId
  )}&species=${speciesTaxId}&required_score=${reqScore}&network_flavor=confidence`;
}
