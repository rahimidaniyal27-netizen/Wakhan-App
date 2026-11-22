const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  let token = null;
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const bearerParts = authHeader.split(' ');
    if (bearerParts.length === 2) {
      token = bearerParts[1];
    } else {
      token = authHeader;
    }
  }

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'wakhan-secret');
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
