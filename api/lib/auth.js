// ── Auth middleware — verifies Supabase JWT on every API request ──────────────
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY   // secret — server-side only
);

/**
 * Verifies the Bearer JWT in the Authorization header.
 * Returns the user object, or throws with 401.
 */
async function requireAuth(req, res) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return null;
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return null;
  }

  return user;
}

module.exports = { requireAuth };
