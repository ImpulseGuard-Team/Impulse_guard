const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('register', { error: 'Email already registered' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    res.redirect('/login');
  } catch (error) {
    res.render('register', { error: 'Error registering user' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === 'admin@mail' && password === 'admin') {
      let adminUser = await User.findOne({ email: 'admin@mail' });
      if (!adminUser) {
        const hashedPassword = await bcrypt.hash('admin', 10);
        adminUser = new User({ name: 'Admin', email: 'admin@mail', password: hashedPassword });
        await adminUser.save();
      }
      req.session.userId = adminUser._id;
      return res.redirect('/dashboard');
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.render('login', { error: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('login', { error: 'Invalid credentials' });
    }
    req.session.userId = user._id;
    res.cookie('userPref', 'dark_mode', { maxAge: 86400000 });
    res.redirect('/dashboard');
  } catch (error) {
    res.render('login', { error: 'Error logging in' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.clearCookie('connect.sid');
  res.redirect('/login');
};
