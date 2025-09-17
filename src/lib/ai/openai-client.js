/**
 * Client-side OpenAI Service
 *
 * This service runs in the browser and uses the OpenAI API key from environment variables.
 * The API key is exposed to the client, so this is only suitable for demo/development purposes.
 * In production, you should use a server-side proxy to protect your API key.
 */

export class OpenAIClientService {
  constructor() {
    // Access the environment variable that Vite exposes to the client
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || localStorage.getItem('openai_api_key');
    this.baseURL = 'https://api.openai.com/v1';

    if (!this.apiKey) {
      console.warn('OpenAI API key not found. Looking for VITE_OPENAI_API_KEY or fallback options.');
    }
  }

  /**
   * Get API key from various sources
   */
  getApiKey() {
    // Try environment variable first
    if (import.meta.env.VITE_OPENAI_API_KEY) {
      return import.meta.env.VITE_OPENAI_API_KEY;
    }

    // Try localStorage
    if (localStorage.getItem('openai_api_key')) {
      return localStorage.getItem('openai_api_key');
    }

    // Try reading from .env.local equivalent (for demo)
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      // In development, we can try to read the API key from our environment
      // Since Vite doesn't expose non-VITE_ prefixed variables to the client,
      // we'll need to use the server-side proxy or expose it as VITE_OPENAI_API_KEY
      return null;
    }

    return null;
  }

  /**
   * Generate content using OpenAI API
   */
  async generateContent({
    prompt,
    model = 'gpt-3.5-turbo',
    maxTokens = 3500,
    temperature = 0.7
  }) {
    const apiKey = this.getApiKey();

    console.log('OpenAI Client Debug:', {
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none',
      promptLength: prompt?.length,
      model
    });

    if (!apiKey) {
      const error = 'OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your environment or configure the key properly.';
      console.error(error);
      throw new Error(error);
    }

    if (!prompt || prompt.trim().length === 0) {
      const error = 'Prompt is required and cannot be empty';
      console.error(error);
      throw new Error(error);
    }

    try {
      const requestBody = {
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert business consultant and writer. Generate professional, detailed, and actionable business content. Focus on practical insights, market analysis, and strategic recommendations. Use proper business terminology and structure your responses clearly with headings and bullet points where appropriate.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature
      };

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 401) {
          throw new Error('Invalid OpenAI API key. Please check your API key configuration.');
        } else if (response.status === 429) {
          throw new Error('OpenAI API rate limit exceeded. Please try again in a moment.');
        } else if (response.status === 402) {
          throw new Error('OpenAI API quota exceeded. Please check your billing.');
        }

        throw new Error(
          errorData.error?.message ||
          `OpenAI API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No content generated from OpenAI');
      }

      const content = data.choices[0].message.content;

      return {
        success: true,
        content,
        usage: data.usage,
        model: data.model
      };

    } catch (error) {
      console.error('OpenAI generation error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  }

  /**
   * Test the API connection
   */
  async testConnection() {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      throw new Error('OpenAI API key not found');
    }

    try {
      const response = await fetch(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const openaiClient = new OpenAIClientService();