const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const path = require('path');

const app = express();

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

mongoose.connect('mongodb://localhost:27017/impulse_guard')
  .then(async () => {
    console.log('Connected to MongoDB');
    // Seed admin user
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    const admin = await User.findOne({ email: 'admin@mail' });
    if (!admin) {
      const hashedPassword = await bcrypt.hash('admin', 10);
      await new User({ name: 'Admin', email: 'admin@mail', password: hashedPassword }).save();
      console.log('Admin user seeded (admin@mail / admin)');
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));

app.use(session({
  secret: 'impulseguardsecret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/impulse_guard' }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const spendingRoutes = require('./routes/spending');

app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/api/spending', spendingRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
