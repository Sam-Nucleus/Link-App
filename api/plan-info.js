// GET /api/plan-info?style=cupping&plan=A&lang=en
// Returns plan notes for the More Info modal. Auth required.

const { requireAuth } = require('./lib/auth');
const { getPlanNotes } = require('./lib/calculate');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const { style, plan, lang = 'en' } = req.query;
  if (!style || !plan) return res.status(400).json({ error: 'style and plan are required' });

  const notes = getPlanNotes(style, plan, lang);
  if (!notes) return res.status(404).json({ error: 'Plan notes not found' });

  return res.status(200).json({ notes });
};
