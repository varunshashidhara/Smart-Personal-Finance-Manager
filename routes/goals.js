import express from 'express';
import auth from '../middleware/auth.js';
import Goal from '../models/Goal.js';

const router = express.Router();

// @route   GET api/goals
// @desc    Get all goals
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const goals = await Goal.find({ user: req.user.id }).sort({
            createdAt: -1,
        });
        res.json(goals);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/goals
// @desc    Add new goal
// @access  Private
router.post('/', auth, async (req, res) => {
    const { name, targetAmount, savedAmount, deadline } = req.body;

    try {
        const newGoal = new Goal({
            name,
            targetAmount,
            savedAmount,
            deadline,
            user: req.user.id,
        });

        const goal = await newGoal.save();

        res.json(goal);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/goals/:id
// @desc    Update goal (e.g. adding savedAmount)
// @access  Private
router.put('/:id', auth, async (req, res) => {
    const { name, targetAmount, savedAmount, deadline } = req.body;

    // Build goal object
    const goalFields = {};
    if (name) goalFields.name = name;
    if (targetAmount) goalFields.targetAmount = targetAmount;
    if (savedAmount !== undefined) goalFields.savedAmount = savedAmount;
    if (deadline) goalFields.deadline = deadline;

    try {
        let goal = await Goal.findById(req.params.id);

        if (!goal) return res.status(404).json({ msg: 'Goal not found' });

        // Make sure user owns goal
        if (goal.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        goal = await Goal.findByIdAndUpdate(
            req.params.id,
            { $set: goalFields },
            { new: true }
        );

        res.json(goal);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
