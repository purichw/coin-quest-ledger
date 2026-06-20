const SUPER_ADMIN_EMAIL = 'purich.wc@gmail.com';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('cache-control', 'no-store');
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('allow', 'GET');
    return json(res, 405, { error: 'Method not allowed.' });
  }

  const hasJson = !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const hasParts = !!(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );

  return json(res, 200, {
    ok: true,
    adminDeleteConfigured: hasJson || hasParts,
    mode: hasJson ? 'service_account_json' : hasParts ? 'service_account_parts' : 'missing',
    allowlistedEmail: SUPER_ADMIN_EMAIL,
    requiredAnyOf: [
      ['FIREBASE_SERVICE_ACCOUNT_JSON'],
      ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY']
    ]
  });
}
