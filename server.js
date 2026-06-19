const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/brokers', require('./routes/broker'));
app.use('/api/vegetables', require('./routes/vegetable'));
app.use('/api/sales', require('./routes/sale'));
app.use('/api/payments', require('./routes/payment'));
app.use('/api/expenses', require('./routes/expense'));

// Base Route
app.get('/', (req, res) => {
  res.send('Mandi Sabji Hisab API is running...');
});

// Error handler middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
