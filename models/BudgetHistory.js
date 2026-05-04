const mongoose = require('mongoose');

const budgetHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  budget: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BudgetHistory', budgetHistorySchema);
