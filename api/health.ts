export default function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  const supabaseUrl = Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const serviceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const allowedOrigins = Boolean(process.env.ALLOWED_ORIGINS);
  const vercelEnv = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';

  return res.status(200).json({
    ok: true,
    timestamp: new Date().toISOString(),
    env: {
      supabaseUrl,
      serviceRoleKey,
      allowedOrigins,
      vercelEnv
    }
  });
}

