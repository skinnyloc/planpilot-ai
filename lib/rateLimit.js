// Simple in-memory rate limiter
// For production, consider using Redis or a database

const rateLimitMap = new Map();

export function rateLimit({ maxRequests = 10, windowMs = 60000 }) {
  return function checkRateLimit(request) {
    const ip = request.headers.get('x-forwarded-for') ||
              request.headers.get('x-real-ip') ||
              'unknown';

    const key = ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!rateLimitMap.has(key)) {
      rateLimitMap.set(key, []);
    }

    const requests = rateLimitMap.get(key);

    // Remove old requests outside the window
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);

    if (recentRequests.length >= maxRequests) {
      return {
        limited: true,
        retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000)
      };
    }

    // Add current request
    recentRequests.push(now);
    rateLimitMap.set(key, recentRequests);

    return {
      limited: false,
      remaining: maxRequests - recentRequests.length
    };
  };
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, requests] of rateLimitMap.entries()) {
    const recent = requests.filter(timestamp => timestamp > now - 300000); // 5 minutes
    if (recent.length === 0) {
      rateLimitMap.delete(key);
    } else {
      rateLimitMap.set(key, recent);
    }
  }
}, 300000); // Clean up every 5 minutes