// GET /api/init-data — returns non-sensitive reference data needed to build the UI
// Countries, varieties, plan lists, translations — but NO power curves or plan notes.
// Auth required.

const { requireAuth } = require('./lib/auth');
const { COUNTRIES, VARIETIES, TRANSLATIONS, ALTITUDE_TABLE, DEFAULT_COUNTRY, DEFAULT_VARIETY } = require('./lib/data');
const { getPlans } = require('./lib/calculate');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  return res.status(200).json({
    countries: COUNTRIES,
    varieties: VARIETIES,
    plans: {
      cupping:  getPlans('cupping'),
      filter:   getPlans('filter'),
      espresso: getPlans('espresso'),
      omni:     getPlans('omni')
    },
    translations: TRANSLATIONS,
    altitudeTable: ALTITUDE_TABLE,
    defaults: {
      country: DEFAULT_COUNTRY,
      variety: DEFAULT_VARIETY
    }
  });
};
