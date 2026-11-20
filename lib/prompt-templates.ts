import type { Location, UserProfile } from '@/types/aerosakhi';

// ---------------------------------------------------------------------------
// Version
// ---------------------------------------------------------------------------

/** Semantic version of the prompt template set. */
export const PROMPT_VERSION = '1.0.0' as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatLocation(location: Location): string {
  const parts = [location.city];
  if (location.region) parts.push(location.region);
  if (location.country) parts.push(location.country);
  return parts.join(', ');
}

function formatHouseholdContext(profile: UserProfile): string {
  const lines: string[] = [];

  lines.push(`📍 Location: ${formatLocation(profile.location)}`);

  if (profile.householdSize !== undefined) {
    lines.push(`👨‍👩‍👧‍👦 Household size: ${profile.householdSize} member(s)`);
  }
  if (profile.hasChildren) {
    lines.push('👶 Has children — prioritise child-safe recommendations');
  }
  if (profile.hasElderly) {
    lines.push('👴 Has elderly members — consider respiratory sensitivities');
  }
  if (profile.livingSpace) {
    lines.push(`🏠 Living space: ${profile.livingSpace}`);
  }
  if (profile.budget) {
    lines.push(`💰 Budget: ${profile.budget}`);
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

/**
 * Returns the main system prompt for the AeroSakhi assistant.
 * When a {@link UserProfile} is provided the prompt is enriched with
 * location-aware, household-specific context.
 */
export function getSystemPrompt(context?: UserProfile): string {
  const householdSection = context
    ? `\n\n## User Context\n${formatHouseholdContext(context)}\n\nTailor every recommendation to this user's specific situation, location, budget, and household composition.`
    : '';

  return `You are **AeroSakhi** — an expert AI advisor specialising in urban air quality management, winter smog mitigation, and sustainable low-emission living.

## Your Expertise
- Indoor air quality optimisation (ventilation, purification, houseplants, humidity)
- Outdoor pollution exposure reduction and safe commute planning
- Low-emission daily routines (cooking, heating, transport, waste management)
- Health effects of PM2.5, PM10, NO₂, SO₂, CO, and ground-level O₃
- Air Quality Index (AQI) interpretation and actionable health advisories
- Sustainable alternatives tailored to budget constraints and local availability
- Special considerations for children, elderly, and people with respiratory conditions

## Response Guidelines
1. **Structure** every reply with clear markdown headings and bullet points.
2. **Quantify** impact wherever possible (e.g., "switching to an induction stove can reduce indoor PM2.5 by ~60%").
3. **Prioritise** recommendations by ease of adoption (easy → moderate → challenging).
4. Use numbered or bulleted lists instead of markdown tables — tables render poorly in this interface. Present tabular data as a numbered list with bold labels, e.g.:
   - **1. Close windows** — Priority: Easy | Impact: Reduces outdoor influx by ~70% | Note: Seal gaps with weatherstripping.
5. Maintain a professional, clinical, and environmental editorial tone. Do NOT spam decorative emojis or produce generic AI-style superficial filler.
6. When the user's location is unknown, ask about it so you can contextualise advice.
7. Always include a brief **Health Note** disclaimer: recommendations are informational and not a substitute for professional medical advice.
8. When discussing AQI levels, reference both the US EPA scale and local equivalents where applicable.
9. Cite specific pollutant thresholds when relevant (WHO 2021 guidelines).${householdSection}`;
}

// ---------------------------------------------------------------------------
// Analysis prompt
// ---------------------------------------------------------------------------

/**
 * Builds the user message prompt for the routine-analysis endpoint.
 * Instructs the model to return a structured JSON response matching the
 * {@link AnalyzeResponse} schema.
 */
export function getAnalysisPrompt(
  routines: string[],
  location: Location,
  preferences?: string[],
): string {
  const routineList = routines
    .map((r, i) => `${i + 1}. ${r}`)
    .join('\n');

  const prefSection = preferences && preferences.length > 0
    ? `\n\nUser preferences:\n${preferences.map((p) => `- ${p}`).join('\n')}`
    : '';

  return `Analyse the following daily routines for a household located in **${formatLocation(location)}** and suggest low-emission, health-improving alternatives.

## Current Routines
${routineList}${prefSection}

## Required Output Format
Respond with a **single valid JSON object** matching this exact schema — no markdown fences, no commentary outside the JSON:

{
  "suggestions": [
    {
      "id": "<unique-id>",
      "category": "transport" | "cooking" | "heating" | "indoor" | "outdoor" | "lifestyle",
      "currentRoutine": "<what the user currently does>",
      "suggestedAlternative": "<your recommended alternative>",
      "emissionReduction": "<estimated % or qualitative reduction>",
      "healthBenefit": "<primary health benefit>",
      "difficulty": "easy" | "moderate" | "challenging",
      "impact": "low" | "moderate" | "high" | "severe" | "hazardous"
    }
  ],
  "overallImpact": {
    "score": <0-100>,
    "level": "low" | "moderate" | "high" | "severe" | "hazardous",
    "description": "<summary of overall impact>"
  },
  "airQualityTips": [
    "<general tip 1>",
    "<general tip 2>",
    "<general tip 3>"
  ]
}

Provide at least one suggestion per routine. Be specific and actionable.`;
}

// ---------------------------------------------------------------------------
// Streaming prompt
// ---------------------------------------------------------------------------

/**
 * Returns a concise system prompt optimised for streaming / real-time
 * conversations — shorter than the full system prompt to keep latency low.
 */
export function getStreamingPrompt(context?: UserProfile): string {
  const locationHint = context
    ? ` The user is in ${formatLocation(context.location)}.`
    : '';

  return `You are AeroSakhi, an authoritative urban air-quality and smog mitigation advisor.${locationHint} Provide precise, actionable guidance in 2-3 structured paragraphs. Focus on real-world engineering, indoor sealing, and personal exposure reduction. Maintain an objective, scientific tone and add a brief health disclaimer when giving respiratory advice.`;
}
