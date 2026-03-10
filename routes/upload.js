import express from 'express';
import multer from 'multer';
import csvParser from 'csv-parser';
import fs from 'fs';
import path from 'path';
import auth from '../middleware/auth.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();

// Define multer storage
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

// Helper to auto-categorize based on description keywords
const autoCategorize = (description) => {
    const descLower = description.toLowerCase();
    if (descLower.includes('amazon') || descLower.includes('flipkart') || descLower.includes('myntra')) return 'Shopping';
    if (descLower.includes('uber') || descLower.includes('ola') || descLower.includes('metro') || descLower.includes('petrol')) return 'Transport';
    if (descLower.includes('swiggy') || descLower.includes('zomato') || descLower.includes('dominos') || descLower.includes('restaurant')) return 'Food';
    if (descLower.includes('netflix') || descLower.includes('spotify') || descLower.includes('movie')) return 'Entertainment';
    if (descLower.includes('electricity') || descLower.includes('water') || descLower.includes('wifi') || descLower.includes('recharge')) return 'Utilities';
    if (descLower.includes('salary') || descLower.includes('freelance') || descLower.includes('dividend')) return 'Income';
    return 'Other';
};


// @route   POST api/upload/csv
// @desc    Upload Bank Statement CSV
// @access  Private
router.post('/csv', [auth, upload.single('statement')], async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ msg: 'No file uploaded' });
    }

    const results = [];
    const filePath = req.file.path;

    fs.createReadStream(filePath)
        .pipe(csvParser({
            mapHeaders: ({ header }) => header.trim(),
            skipEmptyLines: true
        }))
        .on('data', (data) => {
            // Assuming CSV headers: Date, Description, Amount
            // Note: Data format handling might need strict validation in a production environment
            if (data.Date && data.Description && data.Amount) {

                let amountStr = String(data.Amount).replace(/,/g, '').trim();
                const amount = parseFloat(amountStr);

                // Use explicit category if provided in CSV, else auto-categorize
                const category = data.Category ? data.Category.trim() : autoCategorize(data.Description);

                let type = 'Expense';
                let absAmount = Math.abs(amount);

                if (category === 'Income' || amount > 0) {
                    if (amount > 0 && category === 'Income') type = 'Income';
                    else if (amount > 0 && category !== 'Income') {
                        type = 'Expense';
                    } else if (amount < 0) {
                        type = 'Expense';
                    }
                }

                // Handle both DD/MM/YYYY and YYYY-MM-DD
                let formattedDate;
                if (data.Date.includes('/')) {
                    const parts = data.Date.split('/');
                    if (parts[2].length === 4) { // DD/MM/YYYY
                        formattedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                    } else {
                        formattedDate = new Date(data.Date);
                    }
                } else if (data.Date.includes('-')) { // YYYY-MM-DD
                    formattedDate = new Date(data.Date);
                } else {
                    formattedDate = new Date();
                }

                // Check for invalid date
                if (isNaN(formattedDate.getTime())) {
                    formattedDate = new Date();
                }

                const transactionItem = {
                    user: req.user.id,
                    type: type,
                    amount: absAmount,
                    category: category,
                    date: formattedDate,
                    description: data.Description,
                };
                results.push(transactionItem);
            }
        })
        .on('end', async () => {
            try {
                // Bulk insert
                await Transaction.insertMany(results);

                // Clean up file
                fs.unlinkSync(filePath);

                res.json({ msg: 'Transactions uploaded and categorized successfully', count: results.length });
            } catch (err) {
                console.error(err);
                res.status(500).send('Error saving transactions');
            }
        });
});

export default router;
