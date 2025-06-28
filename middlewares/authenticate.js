import jwt from 'jsonwebtoken'

import db from '../config/db.js'

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [users] = await db.query('SELECT * FROM users WHERE user_id = ?', [decoded.userId]);
    
    if (!users.length) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = users[0];
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export default authenticate