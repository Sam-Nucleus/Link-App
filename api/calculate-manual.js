// POST /api/calculate-manual — manual profile mode calculator
// Auth required. No raw power curve data ever sent to client.

const { requireAuth } = require('./lib/auth');
const { calculateManual } = require('./lib/calculate');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch(_) { body = {}; } }
    if (!body || typeof body !== 'object') body = {};

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
  } catch (err) {
    console.error('[calculate-manual] unhandled error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
