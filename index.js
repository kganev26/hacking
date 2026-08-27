const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from the 'public' folder (for index.html)
app.use(express.static(path.join(__dirname, 'public')));

// Connect to Aiven MySQL using Environment Variables (secure approach)
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'defaultdb',
    ssl: { rejectUnauthorized: true }
});

// Serve the frontend page at the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// User Registration Route
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
        db.query(sql, [username, hashedPassword], (err) => {
            if (err) return res.status(400).send('Registration failed. Username may already exist.');
            res.send('User registered successfully in Aiven DB!');
        });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// User Login Route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ?';
    
    db.query(sql, [username], async (err, results) => {
        if (err || results.length === 0) return res.status(400).send('User not found.');
        
        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            res.send(`Welcome back, ${user.username}! Login successful.`);
        } else {
            res.status(401).send('Incorrect password.');
        }
    });
});

// CRITICAL FOR VERCEL: Export the app module instead of using app.listen()
module.exports = app;