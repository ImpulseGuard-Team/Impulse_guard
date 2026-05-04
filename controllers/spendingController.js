const Spending = require('../models/Spending');
const User = require('../models/User');
const BudgetHistory = require('../models/BudgetHistory');

exports.addSpending = async (req, res) => {
  try {
    const { title, amount, category } = req.body;
    const newSpending = new Spending({ userId: req.session.userId, title, amount: Number(amount), category });
    await newSpending.save();
    res.json({ success: true, spending: newSpending });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add spending' });
  }
};

exports.getSpending = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const spendings = await Spending.find({
      userId: req.session.userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ date: -1 });

    // Also return today's total for calculations
    const todayTotal = spendings.reduce((s, t) => s + t.amount, 0);
    const user = await User.findById(req.session.userId);
    const budget = user ? user.budget || 5000 : 5000;

    res.json({ success: true, spendings, todayTotal, budget });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch spending' });
  }
};

exports.getAllSpending = async (req, res) => {
  try {
    const spendings = await Spending.find({
      userId: req.session.userId
    }).sort({ date: -1 });
    res.json({ success: true, spendings });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch spending' });
  }
};

exports.updateSpending = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount, category } = req.body;
    const updated = await Spending.findOneAndUpdate(
      { _id: id, userId: req.session.userId },
      { title, amount: Number(amount), category },
      { new: true }
    );
    res.json({ success: true, spending: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update spending' });
  }
};

exports.deleteSpending = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Spending.findOneAndDelete({ _id: id, userId: req.session.userId });
    if (!result) {
      return res.status(404).json({ success: false, error: 'Record not found or unauthorized' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete spending' });
  }
};

exports.updateBudget = async (req, res) => {
  try {
    const { budget } = req.body;
    const parsedBudget = Number(budget);
    if (isNaN(parsedBudget) || parsedBudget <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid budget' });
    }
    await User.findByIdAndUpdate(req.session.userId, { budget: parsedBudget });
    // Save budget history entry
    await new BudgetHistory({ userId: req.session.userId, budget: parsedBudget }).save();
    res.json({ success: true, budget: parsedBudget });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update budget' });
  }
};

exports.getBudgetHistory = async (req, res) => {
  try {
    const history = await BudgetHistory.find({ userId: req.session.userId }).sort({ date: -1 }).limit(20);
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch budget history' });
  }
};
