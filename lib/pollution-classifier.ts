import type {
  ClassificationResult,
  QueryComplexity,
  ModelTier,
} from '@/types/aerosakhi';

// ---------------------------------------------------------------------------
// Complexity pattern definitions
// ---------------------------------------------------------------------------

/**
 * Regex patterns grouped by {@link QueryComplexity} level.
 * Evaluated in priority order: complex → moderate → simple.
 */
export const COMPLEXITY_PATTERNS: Record<QueryComplexity, RegExp[]> = {
  complex: [
    // Health conditions & vulnerable groups
    /\b(asthma|copd|bronchitis|respiratory|cardiovascular|lung cancer|pulmonary)\b/i,
    /\b(children|elderly|pregnant|infant|newborn|toddler)\b.*\b(health|risk|danger|safe)\b/i,
    // Chemical compounds & pollutants
    /\b(pm2\.?5|pm10|no[₂2]|so[₂2]|co2|co₂|ozone|o[₃3]|voc|benzene|formaldehyde)\b/i,
    // Multi-factor analysis
    /\b(compare|comparison|versus|vs\.?|difference between|trade-?off)\b/i,
    /\b(long[- ]?term|chronic|cumulative|over time|year[- ]round)\b/i,
    // Policy & scientific queries
    /\b(policy|regulation|government|legislation|standard|guideline|who guideline)\b/i,
    /\b(study|research|evidence|data|statistic|correlation|cause)\b/i,
    // Multi-city / regional analysis
    /\b(cities|regions|countries|nationwide|global|worldwide)\b/i,
    // Detailed plans
    /\b(comprehensive|detailed|in[- ]?depth|step[- ]?by[- ]?step|plan|strategy|roadmap)\b/i,
  ],
  moderate: [
    // Specific recommendations
    /\b(recommend|suggest|advise|best|which|should i)\b/i,
    // Location-specific advice
    /\b(indoor|outdoor|home|office|school|commute|workplace)\b/i,
    // Seasonal / temporal
    /\b(winter|summer|monsoon|season|morning|evening|night|smog)\b/i,
    // Appliance / product queries
    /\b(purifier|filter|mask|hepa|ionizer|humidifier|ventilation)\b/i,
    // Cooking / heating
    /\b(cook|stove|gas|electric|induction|biomass|fuel|heating)\b/i,
    // Cost / budget considerations
    /\b(cost|budget|cheap|affordable|expensive|worth|investment)\b/i,
  ],
  simple: [
    // Greetings
    /^(hi|hello|hey|good\s*(morning|evening|afternoon)|thanks|thank you|ok|okay)\b/i,
    // Yes / no questions
    /^(is|are|can|do|does|will|should)\s+\w+\s*\??$/i,
    // Single-topic lookups
    /\b(what is|define|meaning of|aqi|tell me about)\b/i,
    // Quick tips
    /\b(quick|simple|easy|basic|tip|hack)\b/i,
  ],
};

// ---------------------------------------------------------------------------
// Category detection patterns
// ---------------------------------------------------------------------------

const CATEGORY_PATTERNS: Record<string, RegExp> = {
  health: /\b(health|medical|disease|symptom|respiratory|asthma|lung|breathe|breathing)\b/i,
  transport: /\b(transport|commute|drive|car|bus|metro|cycle|bike|walk|traffic|vehicle|emission)\b/i,
  indoor: /\b(indoor|home|room|ventilation|purifier|filter|plant|air quality inside)\b/i,
  cooking: /\b(cook|kitchen|stove|gas|electric|induction|biomass|smoke|fume)\b/i,
  heating: /\b(heat|warm|furnace|boiler|fireplace|radiator|insulation|blanket)\b/i,
  outdoor: /\b(outdoor|outside|park|jog|run|exercise|mask|n95|pollution level)\b/i,
  lifestyle: /\b(lifestyle|routine|habit|daily|schedule|change|sustainable|eco)\b/i,
  children: /\b(child|kid|baby|infant|school|playground|toddler|pediatric)\b/i,
};

// ---------------------------------------------------------------------------
// Classification logic
// ---------------------------------------------------------------------------

/**
 * Heuristically classifies a user query to determine its complexity,
 * the recommended model tier, the matched topic categories, and a
 * confidence score.
 *
 * The classifier uses regex patterns — no network calls or AI inference —
 * so it runs synchronously and is suitable for pre-routing.
 */
export function classifyQuery(input: string): ClassificationResult {
  const trimmed = input.trim();

  // Edge case: empty or whitespace-only
  if (trimmed.length === 0) {
    return { complexity: 'simple', model: 'fast', categories: [], confidence: 0 };
  }

  const lower = trimmed.toLowerCase();
  const wordCount = trimmed.split(/\s+/).length;

  // ── Match patterns ────────────────────────────────────────────────────
  let complexMatches = 0;
  let moderateMatches = 0;
  let simpleMatches = 0;

  for (const pattern of COMPLEXITY_PATTERNS.complex) {
    if (pattern.test(lower)) complexMatches++;
  }
  for (const pattern of COMPLEXITY_PATTERNS.moderate) {
    if (pattern.test(lower)) moderateMatches++;
  }
  for (const pattern of COMPLEXITY_PATTERNS.simple) {
    if (pattern.test(lower)) simpleMatches++;
  }

  // ── Detect categories ─────────────────────────────────────────────────
  const categories: string[] = [];
  for (const [cat, pattern] of Object.entries(CATEGORY_PATTERNS)) {
    if (pattern.test(lower)) {
      categories.push(cat);
    }
  }

  // ── Determine complexity ──────────────────────────────────────────────
  let complexity: QueryComplexity;
  let confidence: number;

  const totalMatches = complexMatches + moderateMatches + simpleMatches;

  if (complexMatches > 0 && complexMatches >= moderateMatches) {
    complexity = 'complex';
    confidence = Math.min(1, 0.5 + complexMatches * 0.15);
  } else if (moderateMatches > 0 && moderateMatches > simpleMatches) {
    complexity = 'moderate';
    confidence = Math.min(1, 0.4 + moderateMatches * 0.15);
  } else if (simpleMatches > 0) {
    complexity = 'simple';
    confidence = Math.min(1, 0.5 + simpleMatches * 0.2);
  } else {
    // No pattern matched — heuristic based on length
    if (wordCount <= 5) {
      complexity = 'simple';
      confidence = 0.3;
    } else if (wordCount <= 20) {
      complexity = 'moderate';
      confidence = 0.25;
    } else {
      complexity = 'complex';
      confidence = 0.2;
    }
  }

  // Short messages lean towards simple unless strong complex signals
  if (wordCount < 5 && complexity !== 'complex') {
    complexity = 'simple';
    if (totalMatches === 0) confidence = 0.4;
  }

  // ── Map to model tier ────────────────────────────────────────────────
  const model: ModelTier = complexity === 'simple' ? 'fast' : 'versatile';

  return { complexity, model, categories, confidence };
}
