const express        = require('express');
const router         = express.Router();
const authController = require('../controllers/authController');

// Home page
router.get('/', (req, res) => {
    res.render('index');
});

// Login page
router.get('/login', (req, res) => {
    if (authController.isLoggedIn()) {
        return res.redirect('/dashboard');
    }
    res.render('login', { error: null });
});

// Register page
router.get('/register', (req, res) => {
    if (authController.isLoggedIn()) {
        return res.redirect('/dashboard');
    }
    res.render('register', { error: null });
});

// Dashboard - Fetch user from memory/DB
router.get('/dashboard', (req, res) => {
    if (!authController.isLoggedIn()) return res.redirect('/login');
    const user = authController.getCurrentUser();
    res.render('dashboard', { user });
});

// Insights
router.get('/insight', (req, res) => {
    if (!authController.isLoggedIn()) return res.redirect('/login');
    res.render('insight');
});

// Transactions
router.get('/transactions', (req, res) => {
    if (!authController.isLoggedIn()) return res.redirect('/login');
    const user = authController.getCurrentUser();
    res.render('transactions', { user });
});

// AI Advisor
router.get('/ai-advisor', (req, res) => {
    if (!authController.isLoggedIn()) return res.redirect('/login');
    const user = authController.getCurrentUser();
    res.render('ai-advisor', { user });
});

module.exports = router;
