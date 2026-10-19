import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Plugin middleware pour exécuter les Serverless Functions /api/* en mode dev local Vite
function localApiMiddlewarePlugin(): Plugin {
  return {
    name: 'local-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (!req.url || !req.url.startsWith('/api/')) {
          return next();
        }

        const urlWithoutQuery = req.url.split('?')[0];

        // Normaliser les méthodes helpers res.status et res.json
        if (!res.status) {
          res.status = (code: number) => {
            res.statusCode = code;
            return res;
          };
        }
        if (!res.json) {
          res.json = (data: any) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return res;
          };
        }

        // Lecture du corps JSON si applicable
        if (['POST', 'PATCH', 'PUT'].includes(req.method || '')) {
          const bodyData = await new Promise<string>((resolve) => {
            let acc = '';
            req.on('data', (chunk: any) => { acc += chunk; });
            req.on('end', () => resolve(acc));
          });
          try {
            req.body = bodyData ? JSON.parse(bodyData) : {};
          } catch {
            req.body = bodyData;
          }
        }

        try {
          // Route /api/admin/users/:id
          const userMatch = urlWithoutQuery.match(/^\/api\/admin\/users\/([^/]+)$/);
          if (userMatch) {
            const id = userMatch[1];
            req.query = { ...(req.query || {}), id };
            const mod = await server.ssrLoadModule('/api/admin/users/[id].ts');
            return await mod.default(req, res);
          }

          // Route /api/admin/users
          if (urlWithoutQuery === '/api/admin/users') {
            const mod = await server.ssrLoadModule('/api/admin/users.ts');
            return await mod.default(req, res);
          }

          res.status(404).json({ error: 'Endpoint introuvable.' });
        } catch (err: any) {
          console.error('[ARCHIVA API DEV ERROR]', err);
          res.status(500).json({ error: err.message || 'Erreur serveur interne en mode dev.' });
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), localApiMiddlewarePlugin()],
  server: {
    port: 5173,
    host: true
  }
});
