// Simple in-memory rate limiting
const requests = new Map();

export function rateLimit(identifier, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Get or create request log for this identifier
  if (!requests.has(identifier)) {
    requests.set(identifier, []);
  }

  const requestLog = requests.get(identifier);

  // Remove old requests outside the window
  const validRequests = requestLog.filter(timestamp => timestamp > windowStart);

  // Check if limit exceeded
  if (validRequests.length >= maxRequests) {
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      resetTime: Math.min(...validRequests) + windowMs
    };
  }

  // Add current request
  validRequests.push(now);
  requests.set(identifier, validRequests);

  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - validRequests.length,
    resetTime: now + windowMs
  };
}