const express = require('express');
const cors = require('cors');
const userRoute= require('./routes/user')
const adminRoute= require('./routes/admin')

const cookieParser = require('cookie-parser');


const app = express();

// Middleware

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173', // your frontend origin
  credentials: true                // allow cookies to be sent
}));
// API routes
app.use('/user',userRoute)
app.use('/admin',adminRoute)


// Error handling middleware (optional)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

module.exports = app;
