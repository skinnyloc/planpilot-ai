/**
 * OpenAI Integration Service
 *
 * Provides AI content generation with rate limiting, error handling,
 * and streaming support for business content creation.
 */

/**
 * Rate Limiter Class
 * Implements token bucket algorithm for API rate limiting
 */
class RateLimiter {
  constructor(tokensPerMinute = 60, burstLimit = 10) {
    this.tokensPerMinute = tokensPerMinute;
    this.burstLimit = burstLimit;
    this.tokens = burstLimit;
    this.lastRefill = Date.now();
    this.requests = new Map(); // Track requests per user
  }

  async checkLimit(userId) {
    const now = Date.now();
    const timePassed = now - this.lastRefill;

    // Refill tokens based on time passed
    const tokensToAdd = Math.floor((timePassed / 60000) * this.tokensPerMinute);
    this.tokens = Math.min(this.burstLimit, this.tokens + tokensToAdd);
    this.lastRefill = now;

    // Check user-specific limits
    const userRequests = this.requests.get(userId) || { count: 0, resetTime: now + 60000 };

    if (now > userRequests.resetTime) {
      userRequests.count = 0;
      userRequests.resetTime = now + 60000;
    }

    if (userRequests.count >= 10) { // 10 requests per minute per user
      throw new Error('Rate limit exceeded. Please wait before making another request.');
    }

    if (this.tokens < 1) {
      throw new Error('API rate limit exceeded. Please try again later.');
    }

    this.tokens -= 1;
    userRequests.count += 1;
    this.requests.set(userId, userRequests);

    return true;
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter(50, 10); // 50 requests per minute, burst of 10

/**
 * OpenAI Service Class
 */
export class OpenAIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1';

    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
  }

  /**
   * Generate content using OpenAI API
   * @param {Object} params - Generation parameters
   * @param {string} params.prompt - The prompt for generation
   * @param {string} params.model - Model to use (default: gpt-4)
   * @param {number} params.maxTokens - Maximum tokens to generate
   * @param {number} params.temperature - Creativity level (0-1)
   * @param {string} params.userId - User ID for rate limiting
   * @param {boolean} params.stream - Whether to stream the response
   * @returns {Promise<Object>} Generated content
   */
  async generateContent({
    prompt,
    model = 'gpt-4',
    maxTokens = 4000,
    temperature = 0.7,
    userId,
    stream = false
  }) {
    try {
      // Check rate limits
      await rateLimiter.checkLimit(userId);

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
        temperature,
        stream
      };

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message ||
          `OpenAI API error: ${response.status} ${response.statusText}`
        );
      }

      if (stream) {
        return response; // Return the response for streaming
      }

      const data = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No content generated from OpenAI');
      }

      const content = data.choices[0].message.content;
      const usage = data.usage;

      return {
        success: true,
        content,
        usage: {
          promptTokens: usage?.prompt_tokens || 0,
          completionTokens: usage?.completion_tokens || 0,
          totalTokens: usage?.total_tokens || 0
        },
        model: data.model
      };

    } catch (error) {
      console.error('OpenAI generation error:', error);

      // Handle specific OpenAI errors
      if (error.message.includes('rate limit')) {
        throw new Error('API rate limit exceeded. Please wait a moment and try again.');
      } else if (error.message.includes('quota')) {
        throw new Error('API quota exceeded. Please check your OpenAI billing.');
      } else if (error.message.includes('invalid')) {
        throw new Error('Invalid request. Please check your input and try again.');
      }

      throw error;
    }
  }

  /**
   * Generate streaming content
   * @param {Object} params - Generation parameters
   * @returns {AsyncGenerator} Streaming content generator
   */
  async* generateStreamingContent(params) {
    try {
      const response = await this.generateContent({ ...params, stream: true });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Keep the last incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.trim() === 'data: [DONE]') return;

          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const delta = data.choices?.[0]?.delta?.content;

              if (delta) {
                yield {
                  content: delta,
                  usage: data.usage,
                  model: data.model
                };
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming generation error:', error);
      throw error;
    }
  }

  /**
   * Validate generation parameters
   * @param {Object} params - Parameters to validate
   * @returns {Object} Validation result
   */
  validateParams(params) {
    const errors = [];

    if (!params.prompt || typeof params.prompt !== 'string' || params.prompt.trim().length === 0) {
      errors.push('Prompt is required and must be a non-empty string');
    }

    if (params.prompt && params.prompt.length > 8000) {
      errors.push('Prompt is too long (maximum 8000 characters)');
    }

    if (params.maxTokens && (typeof params.maxTokens !== 'number' || params.maxTokens < 1 || params.maxTokens > 4000)) {
      errors.push('maxTokens must be a number between 1 and 4000');
    }

    if (params.temperature && (typeof params.temperature !== 'number' || params.temperature < 0 || params.temperature > 1)) {
      errors.push('temperature must be a number between 0 and 1');
    }

    if (!params.userId || typeof params.userId !== 'string') {
      errors.push('userId is required for rate limiting');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Estimate token count for text
   * @param {string} text - Text to estimate
   * @returns {number} Estimated token count
   */
  estimateTokens(text) {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Check if the service is healthy
   * @returns {Promise<boolean>} Service health status
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('OpenAI health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const openaiService = new OpenAIService();

/**
 * Content Generation Utilities
 */
export class ContentGenerator {
  constructor(openaiService) {
    this.ai = openaiService;
  }

  /**
   * Generate business plan content
   * @param {Object} params - Business plan parameters
   * @returns {Promise<Object>} Generated business plan
   */
  async generateBusinessPlan({
    businessIdea,
    industry,
    targetMarket,
    userId,
    stream = false
  }) {
    const prompt = this.buildBusinessPlanPrompt({
      businessIdea,
      industry,
      targetMarket
    });

    return await this.ai.generateContent({
      prompt,
      maxTokens: 3500,
      temperature: 0.7,
      userId,
      stream
    });
  }

  /**
   * Generate grant proposal content
   * @param {Object} params - Grant proposal parameters
   * @returns {Promise<Object>} Generated grant proposal
   */
  async generateGrantProposal({
    businessIdea,
    grantType,
    fundingAmount,
    projectDescription,
    userId,
    stream = false
  }) {
    const prompt = this.buildGrantProposalPrompt({
      businessIdea,
      grantType,
      fundingAmount,
      projectDescription
    });

    return await this.ai.generateContent({
      prompt,
      maxTokens: 3500,
      temperature: 0.6,
      userId,
      stream
    });
  }

  /**
   * Build business plan prompt
   * @param {Object} params - Business plan parameters
   * @returns {string} Formatted prompt
   */
  buildBusinessPlanPrompt({ businessIdea, industry, targetMarket }) {
    return `Create a comprehensive business plan for the following business:

Business Idea: ${businessIdea}
Industry: ${industry || 'Not specified'}
Target Market: ${targetMarket || 'Not specified'}

Please structure the business plan with the following sections:

1. EXECUTIVE SUMMARY
   - Business concept overview
   - Mission statement
   - Key success factors
   - Financial summary

2. COMPANY DESCRIPTION
   - Company history and ownership
   - Products/services offered
   - Location and facilities
   - Competitive advantages

3. MARKET ANALYSIS
   - Industry overview
   - Target market analysis
   - Market size and trends
   - Competitive analysis

4. ORGANIZATION & MANAGEMENT
   - Organizational structure
   - Management team profiles
   - Personnel plan
   - Advisory board

5. MARKETING & SALES STRATEGY
   - Marketing strategy
   - Sales strategy
   - Pricing strategy
   - Distribution channels

6. OPERATIONS PLAN
   - Product/service development
   - Production process
   - Quality control
   - Inventory management

7. FINANCIAL PROJECTIONS
   - Revenue projections (3 years)
   - Expense forecasts
   - Break-even analysis
   - Funding requirements

8. RISK ANALYSIS
   - Market risks
   - Operational risks
   - Financial risks
   - Mitigation strategies

Provide detailed, professional content for each section with specific insights and actionable recommendations. Use data-driven insights where possible and maintain a professional business tone throughout.`;
  }

  /**
   * Build grant proposal prompt
   * @param {Object} params - Grant proposal parameters
   * @returns {string} Formatted prompt
   */
  buildGrantProposalPrompt({ businessIdea, grantType, fundingAmount, projectDescription }) {
    return `Create a compelling grant proposal for the following project:

Business/Project: ${businessIdea}
Grant Type: ${grantType || 'General business grant'}
Funding Amount Requested: ${fundingAmount || 'Not specified'}
Project Description: ${projectDescription || 'Not specified'}

Please structure the grant proposal with the following sections:

1. EXECUTIVE SUMMARY
   - Project overview
   - Funding request summary
   - Expected outcomes and impact
   - Organization qualifications

2. PROJECT DESCRIPTION
   - Problem statement
   - Project goals and objectives
   - Target beneficiaries
   - Expected outcomes

3. METHODOLOGY AND APPROACH
   - Project activities and timeline
   - Implementation strategy
   - Quality assurance measures
   - Innovation aspects

4. ORGANIZATIONAL CAPACITY
   - Organization background
   - Team qualifications and experience
   - Past project successes
   - Infrastructure and resources

5. BUDGET AND FINANCIAL PLAN
   - Detailed budget breakdown
   - Cost justification
   - Matching funds and leverage
   - Financial sustainability

6. EVALUATION AND MONITORING
   - Success metrics and KPIs
   - Evaluation methodology
   - Reporting schedule
   - Impact measurement

7. SUSTAINABILITY AND SCALABILITY
   - Long-term sustainability plan
   - Potential for replication
   - Community engagement
   - Environmental considerations

8. CONCLUSION AND CALL TO ACTION
   - Summary of key points
   - Funding urgency
   - Partnership opportunities
   - Contact information

Make the proposal persuasive, data-driven, and aligned with typical grant requirements. Emphasize the social or economic impact, innovation, and the organization's capability to execute the project successfully.`;
  }
}

// Export content generator instance
export const contentGenerator = new ContentGenerator(openaiService);