const express = require('express');
const router = express.Router();
const spendingController = require('../controllers/spendingController');

const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) next();
  else res.status(401).json({ success: false, error: 'Unauthorized' });
};

router.use(requireAuth);

// Static routes MUST come before /:id
router.get('/all', spendingController.getAllSpending);
router.get('/budget-history', spendingController.getBudgetHistory);
router.put('/budget', spendingController.updateBudget);

router.post('/', spendingController.addSpending);
router.get('/', spendingController.getSpending);
router.put('/:id', spendingController.updateSpending);
router.delete('/:id', spendingController.deleteSpending);

module.exports = router;
