import type { GeoConfig } from "./config";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Word-boundary match for a brand or alias. Multi-word terms with internal
// punctuation are supported (e.g. "Hugging Face", "GPT-4", "Acme.io"), but
// hyphen/dot/underscore in the surrounding text counts as a boundary so
// compound tokens like "Acme-Hackneyed" don't false-positive against "Acme".
function buildMatcher(terms: string[]): RegExp | null {
  const clean = terms.map((t) => t.trim()).filter((t) => t.length > 0);
  if (clean.length === 0) return null;
  const alt = clean.map(escapeRegex).join("|");
  return new RegExp(`(?<![A-Za-z0-9._-])(?:${alt})(?![A-Za-z0-9._-])`, "gi");
}

export interface CitationResult {
  brandCited: boolean;
  brandMatches: string[];
  competitorsCited: string[];
}

export function detectCitations(
  responseText: string,
  config: GeoConfig,
): CitationResult {
  const brandTerms = [config.brand.name, ...config.brand.aliases];
  const brandRegex = buildMatcher(brandTerms);
  const brandMatches: string[] = [];
  if (brandRegex) {
    const found = responseText.match(brandRegex);
    if (found) brandMatches.push(...new Set(found.map((m) => m)));
  }

  const competitorsCited: string[] = [];
  for (const c of config.competitors) {
    const terms = [c.name, ...c.aliases];
    const re = buildMatcher(terms);
    if (re && re.test(responseText)) competitorsCited.push(c.name);
  }

  return {
    brandCited: brandMatches.length > 0,
    brandMatches,
    competitorsCited,
  };
}
