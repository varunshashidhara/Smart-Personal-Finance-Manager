import express from 'express';
import auth from '../middleware/auth.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();

// @route   GET api/analytics
// @desc    Get dashboard analytics
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user.id });

        let totalIncome = 0;
        let totalExpense = 0;
        const categoryBreakdown = {};

        transactions.forEach((tx) => {
            if (tx.type === 'Income') {
                totalIncome += tx.amount;
            } else if (tx.type === 'Expense') {
                totalExpense += tx.amount;

                // Group by category for charts
                if (categoryBreakdown[tx.category]) {
                    categoryBreakdown[tx.category] += tx.amount;
                } else {
                    categoryBreakdown[tx.category] = tx.amount;
                }
            }
        });

        const balance = totalIncome - totalExpense;

        // Formatting for Chart.js
        const categories = Object.keys(categoryBreakdown);
        const categoryTotals = Object.values(categoryBreakdown);

        res.json({
            totalIncome,
            totalExpense,
            balance,
            categoryBreakdown: {
                labels: categories,
                data: categoryTotals,
            },
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
