/**
 * Anti-brute-force et limitation de débit en mémoire (Sliding window)
 */

interface RateLimitRecord {
  timestamps: number[];
}

const clientRecords = new Map<string, RateLimitRecord>();

// Nettoyage régulier des anciens enregistrements toutes les 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of clientRecords.entries()) {
    record.timestamps = record.timestamps.filter(t => now - t < 60000);
    if (record.timestamps.length === 0) {
      clientRecords.delete(key);
    }
  }
}, 300000);

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 60,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  let record = clientRecords.get(identifier);

  if (!record) {
    record = { timestamps: [] };
    clientRecords.set(identifier, record);
  }

  // Filtrer les requêtes de la fenêtre courante
  record.timestamps = record.timestamps.filter(t => now - t < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0];
    const retryAfterSeconds = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, retryAfterSeconds)
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: maxRequests - record.timestamps.length,
    retryAfterSeconds: 0
  };
}

export function getClientIp(req: any): string {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (forwarded) {
    return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
  }
  return req.headers?.['x-real-ip'] || req.socket?.remoteAddress || '127.0.0.1';
}
