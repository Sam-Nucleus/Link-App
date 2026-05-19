// POST /api/calculate — main profile calculator
// Auth required. Receives inputs, returns result only. No raw data exposed.

const { requireAuth } = require('./lib/auth');
const { calculate } = require('./lib/calculate');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    // req.body is auto-parsed by Vercel for application/json.
    // If it arrives as a string (some runtime versions), parse it.
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch(_) { body = {}; } }
    if (!body || typeof body !== 'object') body = {};

    const { mode, density, process, tubeType, voltage, countryVal, continentVal, varietyCode, forcedPlanId } = body;

    if (!mode || !density || !process || !tubeType || !voltage) {
      return res.status(400).json({ error: 'Missing required fields', received: { mode, density, process, tubeType, voltage } });
    }

    const result = calculate({
      mode,
      density: parseFloat(density),
      process,
      tubeType,
      voltage,
      countryVal: countryVal || '',
      continentVal: continentVal || '',
      varietyCode: varietyCode || '',
      forcedPlanId: forcedPlanId || null
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('[calculate] unhandled error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
