// Hear & Act — local token + static server (zero dependencies, Node 18+).
// Run:  node server.js        then open http://localhost:8787
//
// The AssemblyAI API key NEVER leaves this machine and is never sent to the
// browser. This server reads it from the local Ferbly credential store (or
// from app/.env) and mints a 60-second session token for the page.

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 8787;
const DIR = __dirname;

function parseEnvFile(file) {
  try {
    const out = {};
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
    return out;
  } catch { return {}; }
}

function loadCreds() {
  const home = os.homedir();
  const candidates = [
    path.join(DIR, '.env'),
    path.join(home, 'Library', 'Application Support', 'Assembly + Ferbly', 'credentials.env'),
    path.join(home, 'Documents', 'ChatGPT', 'Hardware hackathon - turn a vintage toy into a voice agent', 'furby', '.env'),
  ];
  let creds = {};
  for (const f of candidates) creds = { ...creds, ...parseEnvFile(f) };
  if (process.env.ASSEMBLYAI_API_KEY) creds.ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
  if (process.env.AGENT_ID_MINIMAL) creds.AGENT_ID_MINIMAL = process.env.AGENT_ID_MINIMAL;
  return creds;
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/token') {
    const creds = loadCreds();
    if (!creds.ASSEMBLYAI_API_KEY || !creds.AGENT_ID_MINIMAL) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Credentials not found. Expected ASSEMBLYAI_API_KEY and AGENT_ID_MINIMAL in app/.env or the Ferbly credential store on this Mac.' }));
      return;
    }
    try {
      const r = await fetch('https://agents.assemblyai.com/v1/token?product=voice_agent&expires_in_seconds=60', {
        headers: { Authorization: `Bearer ${creds.ASSEMBLYAI_API_KEY}` },
      });
      const data = await r.json();
      const token = data.token || data.session_token || data.access_token;
      if (!r.ok || !token) throw new Error('token request failed: ' + r.status);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ token, agentId: creds.AGENT_ID_MINIMAL }));
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: String(e.message || e) }));
    }
    return;
  }

  const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  const full = path.join(DIR, file);
  if (!full.startsWith(DIR) || !fs.existsSync(full)) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream' });
  fs.createReadStream(full).pipe(res);
});

server.listen(PORT, () => console.log(`Hear & Act running at http://localhost:${PORT}`));
