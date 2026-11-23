/**
 * Topic Guard Service
 * Validates whether an incoming question is strictly related to the WhatsApp SaaS platform
 */

export const STANDARD_RESTRICTION_RESPONSE = 
  "I'm specifically designed to help with our WhatsApp SaaS platform. I can assist you with WhatsApp API, Broadcasting, Campaigns, Templates, Automation and platform-related technical support.";

// Explicitly blocked topic patterns (out of domain)
const PROHIBITED_PATTERNS = [
  // General world facts & geography
  /\b(capital of|president of|prime minister|population of|distance to|currency of)\b/i,
  // Weather
  /\b(weather|temperature|forecast|climate|rain today|humidity)\b/i,
  // Sports & Entertainment
  /\b(cricket|football|ipl|fifa|world cup|movie|actor|actress|cinema|song lyrics|box office)\b/i,
  // General programming/coding requests unrelated to platform API
  /\b(write a python|write python code|code a calculator|create a game|binary search|leetcode|react tutorial|javascript tutorial|bubble sort|fibonacci)\b/i,
  // Politics & current events
  /\b(election|political party|bjp|congress|democrat|republican|war in|government policy)\b/i,
  // Personal life advice
  /\b(relationship advice|how to get rich|diet plan|gym workout|recipe|how to cook|astrology|horoscope)\b/i,
  // Non-platform WhatsApp history/trivia
  /\b(who founded whatsapp|jan koum|brian acton|history of whatsapp|whatsapp net worth)\b/i
];

// Prompt injection or system instruction override attempts
const PROMPT_INJECTION_PATTERNS = [
  /ignore (all )?(previous|prior) instructions/i,
  /disregard (all )?(previous|system) instructions/i,
  /you are now in DAN mode/i,
  /act as an unrestricted/i,
  /reveal (the )?(system prompt|internal instructions)/i,
  /what (is|are) your (system prompt|hidden prompt)/i,
  /print your initial prompt/i,
  /repeat the text above/i
];

// Allowed platform domain terms and keywords
const ALLOWED_PLATFORM_TOPICS = [
  // API & Connection
  'api', 'cloud api', 'embedded signup', 'waba', 'phone number', 'connect', 'disconnect',
  'verification', 'tier', 'messaging tier', 'quality rating', 'qr code', 'otp',
  // Campaigns & Broadcasts
  'campaign', 'broadcast', 'schedule', 'scheduled', 'recipient', 'dispatch', 'quota',
  'delivered', 'sent', 'read', 'failed', 'delivery rate', 'throttle', 'batch',
  // Templates
  'template', 'templates', 'marketing template', 'utility template', 'authentication template',
  'buttons', 'quick reply', 'call to action', 'media template', 'meta approval', 'rejected', 'pending',
  // Contacts
  'contact', 'contacts', 'import', 'export', 'csv', 'excel', 'tag', 'tags', 'group',
  'opt-in', 'opt-out', 'stop', 'unsubscribe',
  // Automation & Bot
  'auto reply', 'auto-reply', 'auto reply rule', 'chatbot', 'bot', 'workflow', 'keyword',
  'contains', 'exact match', 'starts with',
  // Inbox
  'inbox', 'team inbox', 'chat', 'agent', 'assignment', 'internal note', 'service window',
  '24 hour', '24-hour', 'customer care', 'conversation',
  // Billing & Plans
  'billing', 'plan', 'plans', 'subscription', 'free trial', 'starter', 'pro', 'enterprise',
  'razorpay', 'invoice', 'invoices', 'payment', 'upgrade', 'downgrade', 'price', 'pricing', 'cost',
  // Meta Errors & Troubleshooting
  'error', 'error code', '131047', '131026', '130429', '131051', '132000', '190',
  'webhook', 'webhooks', 'verify token', 'callback url', 'cors',
  // Platform & Roles
  'superadmin', 'owner', 'admin', 'marketer', 'agent', 'role', 'permission', 'settings',
  'workspace', 'multi-tenant', 'aisensy', 'aiveexa', 'campaignflow', 'kalaakchar'
];

/**
 * Validate incoming question
 * Returns { allowed: boolean, reason?: string, standardResponse?: string }
 */
export function validateTopic(question) {
  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return {
      allowed: false,
      reason: 'EMPTY_QUESTION',
      standardResponse: 'Please provide a question related to our WhatsApp SaaS platform.'
    };
  }

  const text = question.trim();
  const lower = text.toLowerCase();

  // 1. Check for prompt injection attempts
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return {
        allowed: false,
        reason: 'PROMPT_INJECTION_DETECTED',
        standardResponse: STANDARD_RESTRICTION_RESPONSE
      };
    }
  }

  // 2. Check for prohibited out-of-domain patterns
  for (const pattern of PROHIBITED_PATTERNS) {
    if (pattern.test(text)) {
      return {
        allowed: false,
        reason: 'PROHIBITED_DOMAIN',
        standardResponse: STANDARD_RESTRICTION_RESPONSE
      };
    }
  }

  // 3. Positive domain relevance verification
  // Does it contain any allowed platform topic, or is it a greeting/procedural platform query?
  const hasPlatformKeyword = ALLOWED_PLATFORM_TOPICS.some(topic => lower.includes(topic));
  const isPlatformHelpQuery = /\b(platform|system|dashboard|features?|help me|how to|guide me|kaise|karein|batao|karna hai)\b/i.test(text);
  const isGreeting = /^(hi|hello|hey|namaste|pranam|good (morning|afternoon|evening))\b/i.test(lower);

  // If it's a greeting or general platform help query
  if (isGreeting || isPlatformHelpQuery || hasPlatformKeyword) {
    return {
      allowed: true,
      reason: 'ALLOWED_PLATFORM_TOPIC'
    };
  }

  // If question mentions WhatsApp specifically in an application troubleshooting context
  if (/\bwhatsapp\b/i.test(lower)) {
    return {
      allowed: true,
      reason: 'ALLOWED_WHATSAPP_TOPIC'
    };
  }

  // Default: unconfirmed domain
  return {
    allowed: false,
    reason: 'OUT_OF_DOMAIN',
    standardResponse: STANDARD_RESTRICTION_RESPONSE
  };
}
