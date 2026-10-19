export function assertAllowedOrigin(req: any, res: any): boolean {
  const allowedOriginsStr = process.env.ALLOWED_ORIGINS || 'http://localhost:5173,https://uba-rapport.vercel.app,https://archiva-uba.vercel.app';
  const allowedOrigins = allowedOriginsStr.split(',').map(o => o.trim().toLowerCase());
  const origin = (req.headers?.origin || '').trim().toLowerCase();

  // Si pas d'en-tête Origin (ex: requête same-origin ou appel serveur direct), autoriser
  if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0] || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return true;
  }

  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return true;
  }

  res.status(403).json({ error: 'Origine non autorisée par la politique de sécurité UBA.' });
  return false;
}
