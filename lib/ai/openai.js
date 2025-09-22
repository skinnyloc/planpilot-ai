/**
 * Secure AI Service
 *
 * This service uses the server-side API to protect API keys.
 * All OpenAI requests go through our secure backend.
 */

export class AIService {
  constructor() {
    this.baseURL = '/api/ai';
  }

  /**
   * Generate content using the secure server-side API
   */
  async generateContent({
    prompt,
    type = 'general',
    maxTokens = 3500,
    temperature = 0.7
  }) {
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Prompt is required and cannot be empty');
    }

    try {
      const response = await fetch(`${this.baseURL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          type,
          maxTokens,
          temperature
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 401) {
          throw new Error('Authentication required. Please sign in.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        }

        throw new Error(errorData.error || 'AI service unavailable');
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('AI generation error:', error.message);
      throw error;
    }
  }

  /**
   * Test the API connection
   */
  async testConnection() {
    try {
      const response = await fetch(`${this.baseURL}/generate`);
      return response.status !== 404;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
export const openaiClient = aiService; // Backward compatibility