// App constants
export const APP_NAME = 'ReachImpact';
export const APP_DESCRIPTION = 'AI-Powered outbound calling platform';
export const APP_VERSION = '1.0.0';

// Backend API settings
export const API_SETTINGS = {
  // Set this to true to use the new Fastify backend, false to use Firebase
  USE_FASTIFY_BACKEND: false,
  
  // Fastify backend base URL (can be relative or absolute)
  FASTIFY_API_BASE_URL: '/api',
  
  // Deployment type
  // 'development' - Local development environment
  // 'staging' - Staging environment
  // 'production' - Production environment
  DEPLOYMENT_TYPE: 'development',
  
  // API Versions
  API_VERSION: 'v1',
  
  // Timeouts
  REQUEST_TIMEOUT_MS: 30000,
  
  // Polling intervals
  POLL_INTERVAL_MS: 5000,
};

// Authentication settings
export const AUTH_SETTINGS = {
  // Token storage key in localStorage
  TOKEN_STORAGE_KEY: 'auth_token',
  
  // Token expiration in minutes
  TOKEN_EXPIRATION_MINUTES: 60 * 24 * 7, // 7 days
  
  // Minimum password length
  MIN_PASSWORD_LENGTH: 8,
  
  // Default roles
  ROLES: {
    ADMIN: 'admin',
    USER: 'user',
  },
  
  // Initial credits for new users
  INITIAL_CREDITS: 50,
};

// Feature flags
export const FEATURES = {
  // Enable multilingual support
  MULTILINGUAL: true,
  
  // Enable real-time chat
  REAL_TIME_CHAT: true,
  
  // Enable call recording
  CALL_RECORDING: true,
  
  // Enable SMS functionality
  SMS: true,
  
  // Enable voice transcription
  VOICE_TRANSCRIPTION: true,
  
  // Enable sentiment analysis
  SENTIMENT_ANALYSIS: true,
  
  // Enable calendar integration
  CALENDAR_INTEGRATION: false, // Coming soon
  
  // Enable demo mode
  DEMO_MODE: true,
};

// Pricing
export const PRICING = {
  CALL_COST: 10, // credits per call
  SMS_COST: 1, // credits per SMS
  CHAT_COST: 1, // credits per AI chat message
  VOICE_TRANSCRIPTION_COST: 5, // credits per transcription
  SENTIMENT_ANALYSIS_COST: 1, // credits per analysis
  SCRIPT_GENERATION_COST: 3, // credits per script generated
  
  // Credit packages
  CREDIT_PACKAGES: [
    { id: 'starter', name: 'Starter', credits: 100, price: 9.99 },
    { id: 'pro', name: 'Professional', credits: 500, price: 39.99 },
    { id: 'enterprise', name: 'Enterprise', credits: 2000, price: 129.99 },
  ],
};

// Languages
export const LANGUAGES = {
  DEFAULT: 'en',
  
  SUPPORTED: [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  ],
};

// Call settings
export const CALL_SETTINGS = {
  // Maximum call duration in seconds
  MAX_CALL_DURATION: 60 * 30, // 30 minutes
  
  // Default call script template
  DEFAULT_SCRIPT_TEMPLATE: `Hello {{contact.firstName}}, this is {{user.fullName}} from {{user.companyName}}. 
I'm calling about {{campaign.name}}. Do you have a moment to talk?`,
  
  // Call status refresh interval in milliseconds
  STATUS_REFRESH_INTERVAL: 5000,
  
  // Call statuses
  STATUSES: {
    QUEUED: 'queued',
    RINGING: 'ringing',
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed',
    BUSY: 'busy',
    FAILED: 'failed',
    NO_ANSWER: 'no-answer',
    CANCELED: 'canceled',
  },
  
  // Call directions
  DIRECTIONS: {
    INBOUND: 'inbound',
    OUTBOUND: 'outbound',
  },
};

// Campaign settings
export const CAMPAIGN_SETTINGS = {
  // Campaign types
  TYPES: {
    OUTBOUND: 'outbound',
    FOLLOW_UP: 'follow-up',
    NURTURE: 'nurture',
    EVENT: 'event',
    SURVEY: 'survey',
  },
  
  // Campaign statuses
  STATUSES: {
    DRAFT: 'draft',
    ACTIVE: 'active',
    PAUSED: 'paused',
    COMPLETED: 'completed',
  },
  
  // Maximum contacts per campaign
  MAX_CONTACTS: 1000,
  
  // Maximum campaigns per user
  MAX_CAMPAIGNS: 20,
};

// AI settings
export const AI_SETTINGS = {
  // Default model
  DEFAULT_MODEL: 'gpt-4o',
  
  // Available models
  MODELS: [
    { id: 'gpt-4o', name: 'GPT-4o (Recommended)', description: 'Most capable model with vision' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Faster, good for most tasks' },
  ],
  
  // Maximum tokens per request
  MAX_TOKENS: 2000,
  
  // Script generation tone options
  SCRIPT_TONES: [
    { id: 'professional', name: 'Professional' },
    { id: 'friendly', name: 'Friendly' },
    { id: 'casual', name: 'Casual' },
    { id: 'formal', name: 'Formal' },
    { id: 'persuasive', name: 'Persuasive' },
    { id: 'informative', name: 'Informative' },
  ],
};