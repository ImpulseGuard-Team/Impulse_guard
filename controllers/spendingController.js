const Spending = require('../models/Spending');
const User     = require('../models/User');
const auth     = require('./authController');

// Add a new record to MongoDB
async function addSpending(req, res) {
    const { title, amount, category } = req.body;
    const user = auth.getCurrentUser();

    if (!user) return res.status(401).json({ success: false });

    try {
        const newRecord = new Spending({
            userId:   user._id,
            title:    title,
            amount:   Number(amount),
            category: category || 'Other'
        });

        await newRecord.save();
        res.json({ success: true, spending: newRecord });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Database error' });
    }
}

// Get today's records for current user
async function getSpending(req, res) {
    const user = auth.getCurrentUser();
    if (!user) return res.status(401).json({ success: false });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
        const todaySpendings = await Spending.find({
            userId: user._id,
            date:   { $gte: today }
        });

        const todayTotal = todaySpendings.reduce((sum, t) => sum + t.amount, 0);

        res.json({
            success: true,
            spendings: todaySpendings,
            todayTotal: todayTotal,
            budget: user.budget
        });
    } catch (err) {
        res.status(500).json({ success: false });
    }
}

// Get all records for current user
async function getAllSpending(req, res) {
    const user = auth.getCurrentUser();
    if (!user) return res.status(401).json({ success: false });

    try {
        const all = await Spending.find({ userId: user._id }).sort({ date: -1 });
        res.json({ success: true, spendings: all });
    } catch (err) {
        res.status(500).json({ success: false });
    }
}

// Update record
async function updateSpending(req, res) {
    const { title, amount, category } = req.body;
    const user = auth.getCurrentUser();

    try {
        const updated = await Spending.findOneAndUpdate(
            { _id: req.params.id, userId: user._id },
            { title, amount: Number(amount), category },
            { new: true }
        );
        res.json({ success: true, spending: updated });
    } catch (err) {
        res.status(500).json({ success: false });
    }
}

// Delete record
async function deleteSpending(req, res) {
    const user = auth.getCurrentUser();
    try {
        await Spending.findOneAndDelete({ _id: req.params.id, userId: user._id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
}

// Update user budget in DB
async function updateBudget(req, res) {
    const user = auth.getCurrentUser();
    const newBudget = Number(req.body.budget);

    try {
        await User.findByIdAndUpdate(user._id, { budget: newBudget });
        user.budget = newBudget; // Update in-memory copy too
        res.json({ success: true, budget: newBudget });
    } catch (err) {
        res.status(500).json({ success: false });
    }
}

function getBudgetHistory(req, res) {
    res.json({ success: true, history: [] });
}

module.exports = {
    addSpending,
    getSpending,
    getAllSpending,
    updateSpending,
    deleteSpending,
    updateBudget,
    getBudgetHistory
};
