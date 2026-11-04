const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET;
const jwtIssuer = process.env.JWT_ISSUER;
const jwtAudience = process.env.JWT_AUDIENCE;

if (!jwtSecret || Buffer.byteLength(jwtSecret) < 32) {
  throw new Error('JWT_SECRET deve conter pelo menos 32 bytes.');
}
if (!jwtIssuer || !jwtAudience) {
  throw new Error('JWT_ISSUER e JWT_AUDIENCE sao obrigatorios.');
}

function sendUnauthorized(res) {
  return res.status(401).json({
    error: {
      code: 'UNAUTHENTICATED',
      message: 'Token ausente, invalido ou expirado.',
    },
  });
}

function authenticate(req, res, next) {
  const authorization = req.get('Authorization') || '';
  const match = authorization.match(/^Bearer\s+([^\s]+)$/i);
  if (!match) {
    return sendUnauthorized(res);
  }

  try {
    const payload = jwt.verify(match[1], jwtSecret, {
      algorithms: ['HS256'],
      issuer: jwtIssuer,
      audience: jwtAudience,
    });

    const userId = typeof payload?.sub === 'string' ? payload.sub.trim() : '';
    if (!userId || userId.length > 128 || !Number.isFinite(payload.exp)) {
      return sendUnauthorized(res);
    }

    req.auth = { userId };
    return next();
  } catch {
    return sendUnauthorized(res);
  }
}

module.exports = authenticate;