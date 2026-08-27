const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();

// Middleware to parse form data and JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static frontend files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Connect to Aiven MySQL using environment variables
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'defaultdb',
    ssl: { 
        rejectUnauthorized: false // Prevents the self-signed certificate error
    }
});

// Serve the index.html page at the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle User Registration
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).send('Username and password are required.');
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
        
        db.query(sql, [username, hashedPassword], (err) => {
            if (err) {
                return res.status(400).send('Registration failed. Username may already exist.');
            }
            res.send('User registered successfully in Aiven DB!');
        });
    } catch (err) {
        res.status(500).send('Server error during registration.');
    }
});

// Handle User Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Username and password are required.');
    }

    const sql = 'SELECT * FROM users WHERE username = ?';
    
    db.query(sql, [username], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(400).send('User not found.');
        }
        
        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        
        if (match) {
            res.send(`Welcome back, ${user.username}! Login successful.`);
        } else {
            res.status(401).send('Incorrect password.');
        }
    });
});

// Export the app for Vercel serverless functions
module.exports = app;