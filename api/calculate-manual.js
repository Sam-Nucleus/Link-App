// POST /api/calculate-manual — manual profile mode calculator
// Auth required. No raw power curve data ever sent to client.

const { requireAuth } = require('./lib/auth');
const { calculateManual } = require('./lib/calculate');

async function parseJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const body = await parseJsonBody(req);
  const { style, planId, density, process, tubeType, voltage, countryVal, continentVal, varietyCode } = body;

  const result = calculateManual({
    style,
    planId,
    density: parseFloat(density),
    process,
    tubeType,
    voltage,
    countryVal: countryVal || '',
    continentVal: continentVal || '',
    varietyCode: varietyCode || ''
  });

  return res.status(200).json(result);
};
