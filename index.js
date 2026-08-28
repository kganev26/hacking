const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Use mysql.createPool for stable connections in serverless environments
const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'defaultdb',
    ssl: { 
        rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).send('Username and password are required.');
    }

    try {
        const hashedPassword = password;
        const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
        
        db.query(sql, [username, hashedPassword], (err) => {
            if (err) {
                console.error("Database Insert Error:", err);
                return res.status(400).send('Registration failed. Username may already exist.');
            }
            res.send('User registered successfully in Aiven DB!');
        });
    } catch (err) {
        console.error("Server Error:", err);
        res.status(500).send('Server error during registration.');
    }
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).send('Username and password are required.');
    }

    try {
        const hashedPassword = password;
        const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
        
        db.query(sql, [username, hashedPassword], (err) => {
            if (err) {
                console.error("Database Insert Error:", err);
                return res.status(400).send('Registration failed. Username may already exist.');
            }
            res.send('User registered successfully in Aiven DB!');
        });
    } catch (err) {
        console.error("Server Error:", err);
        res.status(500).send('Server error during registration.');
    }
});

module.exports = app;