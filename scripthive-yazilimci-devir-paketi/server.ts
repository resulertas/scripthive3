// Updated: 2026-04-22 - Sync Update
// Updated: 2026-04-22 - Sync Update
// Updated: 2026-04-22 - Sync Update
// Updated: 2026-04-22 - Sync Update
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import JSZip from "jszip";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(cookieParser());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Real-time Collaboration Relay System (SSE + HTTP Message Broadcast)
  interface CollabClient {
    res: express.Response;
    roomId: string;
    userId: string;
  }
  const collabClients = new Set<CollabClient>();

  app.get('/api/collab/events', (req, res) => {
    const roomId = (req.query.roomId as string || '').toUpperCase();
    const userId = req.query.userId as string || 'anonymous';

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (res.flushHeaders) res.flushHeaders();

    const client: CollabClient = { res, roomId, userId };
    collabClients.add(client);

    // Initial connection event
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', roomId, userId })}\n\n`);

    const pingInterval = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch (e) {
        clearInterval(pingInterval);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(pingInterval);
      collabClients.delete(client);
    });
  });

  app.post('/api/collab/message', (req, res) => {
    const { roomId, msg } = req.body;
    if (!roomId || !msg) {
      return res.status(400).json({ error: 'Missing roomId or msg' });
    }
    const cleanRoom = (roomId as string).toUpperCase();
    let sentCount = 0;
    const payload = JSON.stringify(msg);

    collabClients.forEach(client => {
      if (client.roomId === cleanRoom) {
        try {
          client.res.write(`data: ${payload}\n\n`);
          sentCount++;
        } catch (e) {
          collabClients.delete(client);
        }
      }
    });

    res.json({ success: true, deliveredTo: sentCount });
  });

  // Proje ZIP İndirme Endpoint'i (Yazılımcı Devir Paketi ve Tüm Kodlar)
  app.get("/api/download-project-zip", async (req, res) => {
    try {
      const zip = new JSZip();
      const rootDir = process.cwd();

      const addDirectoryToZip = (dirPath: string, zipFolder: JSZip) => {
        const items = fs.readdirSync(dirPath);
        for (const item of items) {
          if (
            item === "node_modules" ||
            item === "dist" ||
            item === ".git" ||
            item === ".cache" ||
            item === ".DS_Store"
          ) {
            continue;
          }

          const fullPath = path.join(dirPath, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            const nestedFolder = zipFolder.folder(item);
            if (nestedFolder) {
              addDirectoryToZip(fullPath, nestedFolder);
            }
          } else {
            const fileData = fs.readFileSync(fullPath);
            zipFolder.file(item, fileData);
          }
        }
      };

      addDirectoryToZip(rootDir, zip);

      const content = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", 'attachment; filename="scripthive-yazilimci-devir-paketi.zip"');
      res.send(content);
    } catch (error) {
      console.error("ZIP creation error:", error);
      res.status(500).json({ error: "ZIP dosyası oluşturulurken bir hata oluştu." });
    }
  });

  // OAuth Routes
  app.get('/api/auth/url', (req, res) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: 'Google Client ID is not configured in environment variables.' });
    }

    const baseUrl = process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : `${req.protocol}://${req.get('host')}`;
    const redirectUri = req.query.redirectUri as string || `${baseUrl}/auth/callback`;
    
    // Pass the redirectUri in the state parameter
    const state = Buffer.from(JSON.stringify({ redirectUri })).toString('base64');
    
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/drive.file email profile',
      access_type: 'offline',
      prompt: 'consent',
      state: state
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    res.json({ url: authUrl });
  });

  app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
    const { code, state } = req.query;
    const baseUrl = process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : `${req.protocol}://${req.get('host')}`;
    let redirectUri = `${baseUrl}/auth/callback`;
    
    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state as string, 'base64').toString('utf-8'));
        if (decoded.redirectUri) {
          redirectUri = decoded.redirectUri;
        }
      } catch (e) {
        console.error("Failed to parse state", e);
      }
    }

    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code: code as string,
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokens = await tokenResponse.json();

      if (tokens.access_token) {
        res.send(`
          <html>
            <head>
              <title>BAĞLANTI BAŞARILI - ScriptHive</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #1e293b; text-align: center; padding: 1.5rem; box-sizing: border-box; }
                .card { background: white; padding: 2.5rem 2rem; border-radius: 1rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1); max-width: 460px; width: 100%; }
                .btn { background: #10b981; color: white; border: none; padding: 0.85rem 1.5rem; border-radius: 0.5rem; cursor: pointer; margin-top: 1.5rem; font-weight: bold; font-size: 1rem; width: 100%; transition: background 0.2s, transform 0.1s; -webkit-tap-highlight-color: transparent; }
                .btn:active { transform: scale(0.98); }
                .btn:hover { background: #059669; }
                .success-icon { font-size: 3.5rem; color: #10b981; margin-bottom: 1rem; display: inline-block; line-height: 1; }
                p { line-height: 1.6; color: #475569; font-size: 1.05rem; margin: 0 0 1rem 0; }
                h2 { margin: 0 0 0.75rem 0; color: #0f172a; font-size: 1.5rem; font-weight: bold; }
                .ipad-notice { display: none; margin-top: 1rem; padding: 1rem; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 0.5rem; text-align: left; animation: fadeIn 0.3s ease-out; }
                .ipad-notice p { margin: 0; color: #0369a1; font-size: 0.95rem; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="success-icon">✓</div>
                <h2>Bağlantı Başarılı</h2>
                <p id="status-text">Giriş yapıldı! ScriptHive uygulamanız arka planda başarıyla güncellendi.</p>
                
                <div id="ipad-help-box" class="ipad-notice">
                  <p><strong>iPad / iOS Kullanıcıları:</strong> Güvenlik nedeniyle bu sekme otomatik kapatılamıyor. Lütfen tarayıcınızın üst kısmındaki <strong>sekmeyi kapatma (X)</strong> tuşuna basarak bu sayfayı elinizle kapatıp ana ScriptHive sayfanıza geri dönün.</p>
                </div>

                <div style="margin-top: 0.5rem;">
                  <button id="close-btn" class="btn" onclick="closeWindow()">Kapat ve ScriptHive'a Dön</button>
                </div>

                <script>
                  const tokens = ${JSON.stringify(tokens)};
                  // Yedekleme ve tetikleme
                  localStorage.setItem('google_auth_tokens', JSON.stringify(tokens));
                  localStorage.setItem('google_auth_trigger', Date.now().toString());
                  
                  const messageData = { type: 'OAUTH_AUTH_SUCCESS', tokens: tokens };

                  // Parent pencereye haber ver
                  if (window.opener) {
                    try {
                      window.opener.postMessage(messageData, '*');
                    } catch (e) {
                      console.error('postMessage failed', e);
                    }
                  }
                  
                  // BroadcastChannel ile diğer sekmelere haber ver
                  try {
                    const bc = new BroadcastChannel('oauth_channel');
                    bc.postMessage(messageData);
                    bc.close();
                  } catch (e) {
                    console.error('BroadcastChannel failed', e);
                  }

                  function closeWindow() {
                    window.close();
                    
                    // iOS / iPad kısıtlamaları altındaki durum
                    setTimeout(() => {
                      document.getElementById('status-text').style.display = 'none';
                      document.getElementById('ipad-help-box').style.display = 'block';
                      const closeBtn = document.getElementById('close-btn');
                      if (closeBtn) {
                        closeBtn.style.display = 'none';
                      }
                    }, 400);
                  }
                  
                  // Otomatik kapatma denemesi (1.5 saniye sonra)
                  setTimeout(() => {
                    closeWindow();
                  }, 1200);
                </script>
              </div>
            </body>
          </html>
        `);
      } else {
        res.status(400).send('Token alınamadı: ' + JSON.stringify(tokens));
      }
    } catch (error) {
      console.error('OAuth error:', error);
      res.status(500).send('Kimlik doğrulama hatası');
    }
  });

  app.get('/api/auth/status', (req, res) => {
    const tokenCookie = req.cookies.google_auth_token;
    if (tokenCookie) {
      res.json({ isAuthenticated: true });
    } else {
      res.json({ isAuthenticated: false });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('google_auth_token', {
      secure: true,
      sameSite: 'none',
      httpOnly: true,
    });
    res.json({ success: true });
  });

  // Google Drive Upload Route
  app.post('/api/drive/upload', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const accessToken = authHeader.split(' ')[1];

    const { fileId, fileName, mimeType, contentBase64 } = req.body;
    
    if (!fileName || !contentBase64) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const fileBuffer = Buffer.from(contentBase64, 'base64');
    
    try {
      let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
      let method = 'POST';
      
      if (fileId) {
        url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
        method = 'PATCH';
      }

      const boundary = '-------314159265358979323846';
      const delimiter = `--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--\r\n`;

      const metadata: any = {
        name: fileName,
        mimeType: mimeType
      };
      
      // If we want to keep it as DOCX, we don't set mimeType to google-apps.document
      // It will use the mimeType from the second part of the multipart request.

      const part1 = Buffer.from(
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) + '\r\n' +
        delimiter +
        `Content-Type: ${mimeType}\r\n\r\n`,
        'utf-8'
      );
      
      const part3 = Buffer.from(closeDelimiter, 'utf-8');
      
      const multipartRequestBody = Buffer.concat([part1, fileBuffer, part3]);

      const uploadResponse = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': multipartRequestBody.length.toString()
        },
        body: multipartRequestBody
      });

      const result = await uploadResponse.json();
      
      if (!uploadResponse.ok) {
        console.error('Drive upload error:', result);
        return res.status(uploadResponse.status).json(result);
      }

      res.json({ success: true, fileId: result.id, url: `https://docs.google.com/document/d/${result.id}/edit` });
    } catch (error) {
      console.error('Drive API error:', error);
      res.status(500).json({ error: 'Failed to upload to Google Drive' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        if (vite && (vite as any).ssrFixStacktrace) {
          (vite as any).ssrFixStacktrace(e);
        }
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();