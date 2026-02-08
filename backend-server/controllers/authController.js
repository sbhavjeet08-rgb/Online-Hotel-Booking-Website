const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

// REGISTER USER
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const [exists] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (exists.length) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Use fixed saltRounds = 10
    const password_hash = await bcrypt.hash(password, 10);

    await db.execute(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, password_hash]
    );

    res.json({ message: 'Registered successfully' });
  } catch (err) {
    next(err);
  }
};

// LOGIN USER
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const [rows] = await db.execute(
      'SELECT id, name, password_hash, is_admin FROM users WHERE email = ?',
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Use your single JWT_SECRET
    const token = jwt.sign(
      { userId: user.id, isAdmin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // keep expiry hardcoded here
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        is_admin: user.is_admin
      }
    });

  } catch (err) {
    next(err);
  }
};

// GET LOGGED IN USER DETAILS
exports.me = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.execute(
      'SELECT id, name, email, is_admin FROM users WHERE id = ?',
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
};
