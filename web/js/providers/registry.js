import { streamOpenAI } from './openai.js';
import { streamAnthropic } from './anthropic.js';
import { streamGemini } from './gemini.js';

const ADAPTERS = { openai: streamOpenAI, anthropic: streamAnthropic, gemini: streamGemini };

export const TYPE_LABELS = {
  openai: 'Compatible con OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Google Gemini',
};

export const PRESETS = [
  { label: 'Ollama (local)', type: 'openai', baseUrl: 'http://localhost:11434/v1', model: 'llama3.2' },
  { label: 'LM Studio (local)', type: 'openai', baseUrl: 'http://localhost:1234/v1', model: 'local-model' },
  { label: 'llama.cpp server (local)', type: 'openai', baseUrl: 'http://localhost:8080/v1', model: 'default' },
  { label: 'OpenAI', type: 'openai', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { label: 'Anthropic', type: 'anthropic', baseUrl: 'https://api.anthropic.com', model: 'claude-sonnet-5-5' },
  { label: 'Google Gemini', type: 'gemini', baseUrl: 'https://generativelanguage.googleapis.com', model: 'gemini-2.0-flash' },
  { label: 'Groq', type: 'openai', baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
  { label: 'OpenRouter', type: 'openai', baseUrl: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o-mini' },
  { label: 'DeepSeek', type: 'openai', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { label: 'Personalizado (API OpenAI)', type: 'openai', baseUrl: '', model: '' },
];

export function streamChat(provider, request) {
  const adapter = ADAPTERS[provider?.type];
  if (!adapter) throw new Error('Configura un proveedor primero (⚙).');
  return adapter(provider, request);
}
