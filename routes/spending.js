const express            = require('express');
const router             = express.Router();
const authController     = require('../controllers/authController');
const spendingController = require('../controllers/spendingController');

// Block access if user is not logged in
function requireAuth(req, res, next) {
    if (authController.isLoggedIn()) {
        return next();
    }
    res.status(401).json({ success: false, error: 'Not logged in' });
}

router.use(requireAuth);

// Static routes must come before /:id to avoid conflicts
router.get('/all',            spendingController.getAllSpending);
router.get('/budget-history', spendingController.getBudgetHistory);
router.put('/budget',         spendingController.updateBudget);

router.post('/',      spendingController.addSpending);
router.get('/',       spendingController.getSpending);
router.put('/:id',    spendingController.updateSpending);
router.delete('/:id', spendingController.deleteSpending);

module.exports = router;
