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

  const { mode, density, process, tubeType, voltage, countryVal, continentVal, varietyCode, forcedPlanId } = req.body;

  if (!mode || !density || !process || !tubeType || !voltage) {
    return res.status(400).json({ error: 'Missing required fields' });
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
};
