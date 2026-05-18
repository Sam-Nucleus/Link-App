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
    console.log('[auth] No token provided');
    res.status(401).json({ error: 'Not authenticated' });
    return null;
  }

  console.log('[auth] Verifying token, length:', token.length, 'prefix:', token.slice(0,10));
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      console.log('[auth] Token rejected:', error?.message || 'no user');
      res.status(401).json({ error: 'Invalid or expired session', detail: error?.message });
      return null;
    }
    console.log('[auth] Token OK, user:', user.email);
    return user;
  } catch (e) {
    console.error('[auth] getUser threw:', e.message);
    res.status(500).json({ error: 'Auth check failed', detail: e.message });
    return null;
  }
}

module.exports = { requireAuth };
