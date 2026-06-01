import { createClient } from '@supabase/supabase-js';

let supabaseAdmin = null;

function getAdmin() {
  if (!supabaseAdmin && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }
  return supabaseAdmin;
}

export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    req.user = null;
    return next(); // demo / unauthenticated allowed in dev
  }

  const admin = getAdmin();
  if (!admin) {
    req.user = null;
    return next(); // Supabase not configured, pass through
  }

  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error) return res.status(401).json({ error: 'Invalid or expired token.' });

  req.user = user;
  next();
}
