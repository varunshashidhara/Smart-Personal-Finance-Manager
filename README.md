# Smart Personal Finance Manager

A comprehensive full-stack web application designed to help users track personal expenses, manage budgets, set financial goals, and visualize their spending habits.

## Features

- **User Authentication**: Secure sign-up and login functionality using JWT (JSON Web Tokens) and bcrypt for password hashing.
- **Transaction Management**: Add, edit, delete, and view income and expense transactions.
- **Budgeting & Goals**: Set financial goals and budgets to track your progress and stay within limits.
- **Data Visualization**: Gain insights into your financial health with charts and visual breakdowns of your spending.
- **Bulk Import**: Easily import your transactions via CSV files.

## Tech Stack

This project is built using the **MERN** stack (focusing on Node, Express, and MongoDB for the backend):

**Backend:**
- **Node.js** & **Express.js**: RESTful API structure.
- **MongoDB** & **Mongoose**: NoSQL database and object modeling.
- **JWT (jsonwebtokn)**: Secure user session management.
- **bcryptjs**: Secure password hashing.
- **multer** & **csv-parser**: For handling file uploads and parsing imported CSV transaction data.
- **dotenv**: Environment variable management.

**Frontend:**
- HTML, CSS, JavaScript (Vanilla setup in the `public` directory)
- Chart.js (or similar library) for visual data representations.

## Project Structure

```text
├── models/         # Mongoose database schemas (User, Transaction, Goals, etc.)
├── routes/         # Express API routes (Auth, Transactions, Uploads, etc.)
├── middleware/     # Custom middleware (like JWT authentication guards)
├── public/         # Frontend static files (HTML, CSS, JS)
├── uploads/        # Directory for temporarily storing uploaded CSV files
├── server.js       # Main application entry point
└── package.json    # Project dependencies and scripts
```

## Getting Started

### Prerequisites
Make sure you have Node.js and MongoDB installed on your local machine.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/varunshashidhara/Smart-Personal-Finance-Manager.git
   cd Smart-Personal-Finance-Manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory and add the following variables:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```

4. **Start the application**
   ```bash
   node server.js
   ```
   The server will start running, typically on `http://localhost:5000`. You can access the frontend by navigating to that URL in your browser.

## API Endpoints (Overview)
- `/api/auth` - Register, Login, and User management.
- `/api/transactions` - CRUD operations for user expenses and income.
- `/api/goals` - Manage financial goals and budgets.
- `/api/upload` - CSV file uploading for bulk transaction imports.

## License
This project is licensed under the MIT License. 
Developed By Varun S
