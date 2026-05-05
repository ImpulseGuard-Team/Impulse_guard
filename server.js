const express  = require('express');
const path     = require('path');
const mongoose = require('mongoose');

const app = express();

// Connect to MongoDB Compass (Local)
mongoose.connect('mongodb://127.0.0.1:27017/impulse_guard')
    .then(() => console.log('Connected to MongoDB Compass'))
    .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Load routes
const indexRoutes    = require('./routes/index');
const authRoutes     = require('./routes/auth');
const spendingRoutes = require('./routes/spending');

app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/api/spending', spendingRoutes);

// Start server
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
