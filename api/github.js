export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');
    return res.status(200).end();
  }

  const password = req.headers['x-admin-password'];
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Non autorizzato' });
  }

  const { path } = req.query;
  if (!path) return res.status(400).json({ error: 'Path mancante' });

  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;

  if (!repo || !token) {
    return res.status(500).json({ error: 'Configurazione server mancante. Imposta GITHUB_REPO, GITHUB_TOKEN e ADMIN_PASSWORD nelle variabili d\'ambiente Vercel.' });
  }

  const url = `https://api.github.com/repos/${repo}/${path}`;
  const opts = {
    method: req.method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'TravelApp-Admin',
    },
  };

  if (req.method !== 'GET' && req.method !== 'DELETE' && req.body) {
    opts.body = JSON.stringify(req.body);
  }

  const ghRes = await fetch(url, opts);

  if (req.method === 'DELETE' && ghRes.ok) {
    return res.status(204).end();
  }

  const data = await ghRes.json();
  return res.status(ghRes.status).json(data);
}
