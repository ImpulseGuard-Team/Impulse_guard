const User = require('../models/User');

// Tracks the logged-in user in memory
// Resets when server restarts
let currentUser = null;

// Check if anyone is logged in
function isLoggedIn() {
    return currentUser !== null;
}

// Get current user object
function getCurrentUser() {
    return currentUser;
}

// Handle login
async function login(req, res) {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email, password }); // Plain text check

        if (user) {
            currentUser = user;
            return res.redirect('/dashboard');
        }

        res.render('login', { error: 'Invalid email or password' });
    } catch (err) {
        res.render('login', { error: 'Database error' });
    }
}

// Handle registration (Saves to MongoDB)
async function register(req, res) {
    const { name, email, password } = req.body;

    try {
        const existing = await User.findOne({ email });
        if (existing) {
            return res.render('register', { error: 'Email already exists' });
        }

        const newUser = new User({ name, email, password });
        await newUser.save();

        res.redirect('/login');
    } catch (err) {
        res.render('register', { error: 'Error creating account' });
    }
}

// Handle logout
function logout(req, res) {
    currentUser = null;
    res.redirect('/login');
}

module.exports = { isLoggedIn, getCurrentUser, login, register, logout };
