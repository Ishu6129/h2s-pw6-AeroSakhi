// types/aerosakhi.ts — ALL TypeScript types for the AeroSakhi project

/**
 * Severity classification for air pollution levels,
 * ranging from minimal concern to immediate health hazard.
 */
export type PollutionSeverity = 'low' | 'moderate' | 'high' | 'severe' | 'hazardous';

/**
 * Complexity tier of an incoming user query,
 * used to route the request to the appropriate model.
 */
export type QueryComplexity = 'simple' | 'moderate' | 'complex';

/**
 * AI model tier selection based on query complexity.
 * - `fast`      — lightweight model for simple queries.
 * - `versatile` — full-capability model for complex queries.
 */
export type ModelTier = 'fast' | 'versatile';

/**
 * Type of living space the user resides in,
 * influencing air-quality recommendations.
 */
export type LivingSpace = 'apartment' | 'house' | 'studio';

/**
 * User's self-reported budget level,
 * used to tailor cost-appropriate suggestions.
 */
export type BudgetLevel = 'low' | 'medium' | 'high';

/**
 * Role of a participant in a chat conversation.
 * - `user`      — the end-user sending messages.
 * - `assistant` — the AI assistant responding.
 * - `system`    — system-level instructions or context.
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Category of a daily routine that may contribute
 * to or be affected by air pollution.
 */
export type RoutineCategory = 'transport' | 'cooking' | 'heating' | 'indoor' | 'outdoor' | 'lifestyle';

/**
 * Difficulty level of adopting a suggested routine change.
 */
export type DifficultyLevel = 'easy' | 'moderate' | 'challenging';

/**
 * Type of event emitted during a streaming AI response.
 * - `token` — an incremental content token.
 * - `done`  — signals the stream has completed.
 * - `error` — an error occurred during streaming.
 */
export type StreamEventType = 'token' | 'done' | 'error';

/**
 * Geographical location of a user, used for
 * fetching region-specific air-quality data.
 */
export interface Location {
  /** City name (required). */
  city: string;
  /** State, province, or administrative region. */
  region?: string;
  /** ISO country name or code. */
  country?: string;
}

/**
 * Profile information about the user and their household,
 * providing context for personalised recommendations.
 */
export interface UserProfile {
  /** The user's geographical location. */
  location: Location;
  /** Number of people in the household. */
  householdSize?: number;
  /** Whether the household includes children. */
  hasChildren?: boolean;
  /** Whether the household includes elderly members. */
  hasElderly?: boolean;
  /** Type of living space the user occupies. */
  livingSpace?: LivingSpace;
  /** User's budget level for implementing suggestions. */
  budget?: BudgetLevel;
}

/**
 * A single message within a chat conversation,
 * stored on the client for history and display.
 */
export interface ChatMessage {
  /** Unique identifier for the message. */
  id: string;
  /** Role of the message author. */
  role: MessageRole;
  /** Text content of the message. */
  content: string;
  /** Unix-epoch timestamp (milliseconds) when the message was created. */
  timestamp: number;
  /** Name of the AI model that generated this message, if applicable. */
  model?: string;
  /** Classified complexity of the query, if applicable. */
  complexity?: QueryComplexity;
}

/**
 * Payload sent from the client to the `/chat` API endpoint.
 */
export interface ChatRequest {
  /** The user's message text. */
  message: string;
  /** Optional user profile for personalised responses. */
  context?: UserProfile;
  /** Optional conversation history for multi-turn context. */
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/**
 * Response returned by the `/chat` API endpoint.
 */
export interface ChatResponse {
  /** The assistant's reply text. */
  message: string;
  /** Name of the AI model used to generate the response. */
  model: string;
  /** Classified complexity of the original query. */
  complexity: QueryComplexity;
  /** Number of tokens consumed by this request, if tracked. */
  tokensUsed?: number;
}

/**
 * Payload sent from the client to the `/analyze` API endpoint
 * to evaluate the user's daily routines against air quality.
 */
export interface AnalyzeRequest {
  /** List of the user's current daily routines as free-text descriptions. */
  routines: string[];
  /** The user's geographical location for air-quality context. */
  location: Location;
  /** Optional lifestyle or health preferences to guide suggestions. */
  preferences?: string[];
}

/**
 * Response returned by the `/analyze` API endpoint,
 * containing actionable routine improvements.
 */
export interface AnalyzeResponse {
  /** Ordered list of suggested routine changes. */
  suggestions: RoutineSuggestion[];
  /** Aggregate impact score summarising overall improvement potential. */
  overallImpact: ImpactScore;
  /** General air-quality tips relevant to the user's location. */
  airQualityTips: string[];
}

/**
 * A single suggestion for replacing or modifying
 * a daily routine to reduce pollution exposure or emissions.
 */
export interface RoutineSuggestion {
  /** Unique identifier for the suggestion. */
  id: string;
  /** Category the routine belongs to. */
  category: RoutineCategory;
  /** Description of the user's current routine. */
  currentRoutine: string;
  /** Recommended alternative routine. */
  suggestedAlternative: string;
  /** Estimated reduction in emissions (e.g., "~30%"). */
  emissionReduction: string;
  /** Expected health benefit from adopting the suggestion. */
  healthBenefit: string;
  /** How difficult the change is to adopt. */
  difficulty: DifficultyLevel;
  /** Severity level the suggestion addresses. */
  impact: PollutionSeverity;
}

/**
 * Quantified impact assessment with a numeric score,
 * a human-readable severity level, and a description.
 */
export interface ImpactScore {
  /** Numeric score (0–100) representing overall impact. */
  score: number;
  /** Categorical severity level corresponding to the score. */
  level: PollutionSeverity;
  /** Human-readable explanation of the score. */
  description: string;
}

/**
 * Payload sent to initiate a streaming AI response.
 */
export interface StreamRequest {
  /** The user's message text. */
  message: string;
  /** Optional user profile for personalised streaming responses. */
  context?: UserProfile;
}

/**
 * A single event emitted during a streaming AI response.
 */
export interface StreamEvent {
  /** The kind of stream event. */
  type: StreamEventType;
  /** Incremental content token (present when `type` is `'token'`). */
  content?: string;
  /** Model name (may be present when `type` is `'done'`). */
  model?: string;
  /** Error message (present when `type` is `'error'`). */
  error?: string;
}

/**
 * Result of a rate-limit check for an incoming API request.
 */
export interface RateLimitResult {
  /** Whether the request is allowed to proceed. */
  allowed: boolean;
  /** Number of requests remaining in the current window. */
  remaining: number;
  /** Unix-epoch timestamp (milliseconds) when the rate-limit window resets. */
  resetAt: number;
  /** HTTP headers to attach to the response conveying rate-limit state. */
  headers: Record<string, string>;
}

/**
 * Aggregated API usage statistics for the current client / key.
 */
export interface UsageStats {
  /** Total number of requests made in the current window. */
  totalRequests: number;
  /** Number of requests still available before throttling. */
  remainingRequests: number;
  /** Unix-epoch timestamp (milliseconds) when the usage window resets. */
  windowResetAt: number;
  /** Per-endpoint breakdown of request counts and limits. */
  endpoints: Record<string, { count: number; limit: number }>;
}

/**
 * Result of splitting a long text into token-aware chunks
 * suitable for model context windows.
 */
export interface ChunkResult {
  /** Array of text chunks after splitting. */
  chunks: string[];
  /** Total estimated token count across all chunks. */
  totalTokens: number;
  /** Whether the original text required chunking. */
  wasChunked: boolean;
}

/**
 * Result of classifying a user query to determine
 * its complexity, target model, and topic categories.
 */
export interface ClassificationResult {
  /** Assessed complexity of the query. */
  complexity: QueryComplexity;
  /** Recommended model tier for handling the query. */
  model: ModelTier;
  /** Topic categories identified in the query. */
  categories: string[];
  /** Confidence score of the classification (0–1). */
  confidence: number;
}
