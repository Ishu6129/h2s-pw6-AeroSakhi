import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { validateAnalyzeRequest } from '@/lib/validators';
import { checkRateLimit } from '@/lib/rate-limiter';
import { createChatCompletion, MODEL_VERSATILE } from '@/lib/groq';
import { getSystemPrompt, getAnalysisPrompt } from '@/lib/prompt-templates';
import { generateCacheKey, getCachedResponse, setCachedResponse } from '@/lib/cache';
import type {
  AnalyzeResponse,
  RoutineSuggestion,
  PollutionSeverity,
  DifficultyLevel,
  RoutineCategory,
} from '@/types/aerosakhi';

export const dynamic = 'force-dynamic';

function extractIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return 'anonymous';
}

function normalizeDifficulty(val: unknown): DifficultyLevel {
  const str = String(val || '').toLowerCase();
  if (str.includes('easy') || str.includes('low')) return 'easy';
  if (str.includes('challeng') || str.includes('hard') || str.includes('high')) return 'challenging';
  return 'moderate';
}

function normalizeSeverity(val: unknown): PollutionSeverity {
  const str = String(val || '').toLowerCase();
  if (str.includes('hazard')) return 'hazardous';
  if (str.includes('sever')) return 'severe';
  if (str.includes('high')) return 'high';
  if (str.includes('low') || str.includes('good')) return 'low';
  return 'moderate';
}

function normalizeCategory(val: unknown): RoutineCategory {
  const str = String(val || '').toLowerCase();
  if (str.includes('trans') || str.includes('commut') || str.includes('drive') || str.includes('car') || str.includes('bike')) return 'transport';
  if (str.includes('cook') || str.includes('stove') || str.includes('food') || str.includes('kitchen')) return 'cooking';
  if (str.includes('heat') || str.includes('warm') || str.includes('fire') || str.includes('boiler')) return 'heating';
  if (str.includes('indoor') || str.includes('ventil') || str.includes('purif') || str.includes('window') || str.includes('plant')) return 'indoor';
  if (str.includes('out') || str.includes('walk') || str.includes('jog') || str.includes('park')) return 'outdoor';
  return 'lifestyle';
}

function normalizeResponse(res: AnalyzeResponse): AnalyzeResponse {
  const suggestions: RoutineSuggestion[] = (res.suggestions || []).map((s, idx) => ({
    id: s.id || `sugg-${idx + 1}-${Date.now().toString(36)}`,
    category: normalizeCategory(s.category),
    currentRoutine: s.currentRoutine || 'Current routine',
    suggestedAlternative: s.suggestedAlternative || 'Adopt low-emission alternative',
    emissionReduction: s.emissionReduction || '~35% reduction',
    healthBenefit: s.healthBenefit || 'Reduces particulate matter inhalation',
    difficulty: normalizeDifficulty(s.difficulty),
    impact: normalizeSeverity(s.impact),
  }));

  const score = typeof res.overallImpact?.score === 'number' && !isNaN(res.overallImpact.score)
    ? Math.min(100, Math.max(0, res.overallImpact.score))
    : 72;

  const level = normalizeSeverity(res.overallImpact?.level || (score > 70 ? 'high' : score > 40 ? 'moderate' : 'low'));
  const description = res.overallImpact?.description || 'Significant emissions and exposure reduction potential identified across domestic and transit habits.';

  const airQualityTips = Array.isArray(res.airQualityTips) && res.airQualityTips.length > 0
    ? res.airQualityTips
    : [
        'Shift ventilation hours to 1:00 PM – 3:00 PM when solar radiation temporarily disperses ground-level smog inversions.',
        'Operate HEPA purifiers in closed sleeping zones at continuous low fan speeds rather than intermittent bursts.',
        'Seal leaky exterior window frames with removable weatherstripping tape to block toxic particulate infiltration.',
      ];

  return {
    suggestions,
    overallImpact: { score, level, description },
    airQualityTips,
  };
}

/** Fallback parser if the LLM returned natural language text instead of pure JSON */
function buildStructuredFallback(rawText: string, userRoutines: string[]): AnalyzeResponse {
  const paragraphs = rawText
    .split(/\n\n+/)
    .map((p) => p.replace(/^[#*\s-]+/gm, '').trim())
    .filter((p) => p.length > 20);

  const suggestions: RoutineSuggestion[] = userRoutines.slice(0, 5).map((routine, i) => {
    const matchingAdvice = paragraphs[i] || 'Switch to verified electric or filtered equivalent to eliminate local combustion.';
    return {
      id: `sugg-gen-${i + 1}-${Date.now().toString(36)}`,
      category: normalizeCategory(routine),
      currentRoutine: routine,
      suggestedAlternative: matchingAdvice.slice(0, 160),
      emissionReduction: '-40% to -65% particulate exposure',
      healthBenefit: 'Lowers cumulative PM2.5 and volatile organic inhalation',
      difficulty: i === 0 ? 'easy' : 'moderate',
      impact: i === 0 ? 'high' : 'moderate',
    };
  });

  return {
    suggestions,
    overallImpact: {
      score: 68,
      level: 'moderate',
      description: rawText.slice(0, 320).replace(/[#*`]/g, '').trim() || 'Actionable potential to reduce household exposure and emissions.',
    },
    airQualityTips: [
      'Avoid unventilated morning door openings during temperature inversion hours (5:00 AM - 9:00 AM).',
      'Use certified N95 or FFP2 respirators during urban commuting instead of simple cloth masks.',
      'Transition high-heat domestic cooking to clean induction to eliminate interior nitrogen dioxide (NO2).',
    ],
  };
}

function extractJsonFromResponse(rawReply: string, userRoutines: string[]): AnalyzeResponse {
  const trimmed = rawReply.trim();

  // 1. Try direct parse
  try {
    const parsed = JSON.parse(trimmed) as AnalyzeResponse;
    if (parsed && typeof parsed === 'object') {
      return normalizeResponse(parsed);
    }
  } catch {
    // Proceed to markdown code block extraction
  }

  // 2. Try markdown code block extraction
  const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (jsonMatch && jsonMatch[1]) {
    try {
      const parsed = JSON.parse(jsonMatch[1].trim()) as AnalyzeResponse;
      if (parsed && typeof parsed === 'object') {
        return normalizeResponse(parsed);
      }
    } catch {
      // Proceed to outermost brace extraction
    }
  }

  // 3. Try finding outermost JSON object
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      const slice = trimmed.slice(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(slice) as AnalyzeResponse;
      if (parsed && typeof parsed === 'object') {
        return normalizeResponse(parsed);
      }
    } catch {
      // Proceed to structured fallback
    }
  }

  // 4. Intelligent fallback
  return buildStructuredFallback(rawReply, userRoutines);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = extractIp(request);

  // ── Rate limit ──────────────────────────────────────────────────────
  const rateLimit = checkRateLimit(ip, 'analyze');
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429, headers: rateLimit.headers },
    );
  }

  // ── Validate ────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body.' },
      { status: 400, headers: rateLimit.headers },
    );
  }

  let parsed: ReturnType<typeof validateAnalyzeRequest>;
  try {
    parsed = validateAnalyzeRequest(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed.', details: err.errors },
        { status: 400, headers: rateLimit.headers },
      );
    }
    return NextResponse.json(
      { error: 'Invalid request data.' },
      { status: 400, headers: rateLimit.headers },
    );
  }

  try {
    // ── Check cache for identical routine analysis queries ─────────────
    const cacheKey = generateCacheKey(
      MODEL_VERSATILE,
      JSON.stringify({
        routines: parsed.routines,
        location: parsed.location,
        preferences: parsed.preferences,
      }),
    );

    const cached = getCachedResponse(cacheKey);
    if (cached) {
      try {
        const cachedResponse = JSON.parse(cached) as AnalyzeResponse;
        return NextResponse.json(cachedResponse, {
          status: 200,
          headers: {
            ...rateLimit.headers,
            'X-Cache': 'HIT',
            'Cache-Control': 'private, max-age=300',
          },
        });
      } catch {
        // Cache entry corrupted, proceed to regeneration
      }
    }

    // ── Build prompt ──────────────────────────────────────────────────
    const systemPrompt = getSystemPrompt({
      location: parsed.location,
    });
    const userPrompt = getAnalysisPrompt(
      parsed.routines,
      parsed.location,
      parsed.preferences,
    );

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    // Always use the versatile model for detailed analysis
    const rawReply = await createChatCompletion({
      messages,
      model: MODEL_VERSATILE,
      maxTokens: 4096,
      temperature: 0.4,
    });

    // ── Robust JSON Extraction & Normalization ──────────────────────
    const analysisResponse = extractJsonFromResponse(rawReply, parsed.routines);

    // ── Store in cache ──────────────────────────────────────────────
    setCachedResponse(cacheKey, JSON.stringify(analysisResponse));

    return NextResponse.json(analysisResponse, {
      status: 200,
      headers: {
        ...rateLimit.headers,
        'X-Cache': 'MISS',
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An internal error occurred.';
    return NextResponse.json(
      { error: message },
      { status: 500, headers: rateLimit.headers },
    );
  }
}
