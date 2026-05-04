const express = require('express');
const router = express.Router();
const User = require('../models/User');

const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) next();
  else res.redirect('/login');
};

router.get('/', (req, res) => {
  res.render('index');
});

router.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/dashboard');
  res.render('login', { error: null });
});

router.get('/register', (req, res) => {
  if (req.session.userId) return res.redirect('/dashboard');
  res.render('register', { error: null });
});

router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    res.render('dashboard', { user });
  } catch (err) {
    res.redirect('/login');
  }
});

router.get('/insight', requireAuth, (req, res) => {
  res.render('insight');
});

router.get('/transactions', requireAuth, async (req, res) => {
  const user = await User.findById(req.session.userId);
  res.render('transactions', { user });
});

router.get('/ai-advisor', requireAuth, async (req, res) => {
  const user = await User.findById(req.session.userId);
  res.render('ai-advisor', { user });
});

module.exports = router;
