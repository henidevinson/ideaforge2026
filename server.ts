import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(String(process.env.PORT || 3000), 10) || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Immediate health check endpoints for Cloud Run and monitoring
const healthHandler = (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    event: "IDEAFORGE ' 26",
    registrationMode: 'Google Form (https://forms.gle/bKh4n9VG2XUDcrop7)',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};

app.get('/api/health', healthHandler);
app.get('/healthz', healthHandler);
app.get('/health', healthHandler);

// ----------------------------------------------------
// VITE / STATIC SERVING
// ----------------------------------------------------
async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const indexPath = path.resolve(distPath, 'index.html');
  const hasDist = fs.existsSync(distPath) && fs.existsSync(indexPath);

  if (process.env.NODE_ENV !== 'production' && !hasDist) {
    // Development mode with Vite middleware (hmr: false to prevent WebSocket errors)
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve built assets
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
    }

    app.get('*', (req: Request, res: Response) => {
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>IDEAFORGE ' 26</title>
  </head>
  <body style="font-family:sans-serif;background:#0C061A;color:#FFFFFF;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
    <div style="text-align:center;padding:20px;">
      <h1 style="color:#A78BFA;margin-bottom:8px;">IDEAFORGE ' 26</h1>
      <p style="color:#CBD5E1;">Department of Computer Science & Engineering</p>
      <p style="color:#94A3B8;font-size:14px;">Application is ready. Please refresh.</p>
    </div>
  </body>
</html>`);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[IDEAFORGE '26 Server] Running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer().catch((err: unknown) => {
    console.error('[Server Start Error]:', err);
  });
}

export default app;
