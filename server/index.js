const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(bodyParser.json());

// Store active connections by business code
const activeConnections = new Map();

// Helper function to get or create a database connection
const getDbConnection = (code) => {
    if (activeConnections.has(code)) {
        return activeConnections.get(code);
    }
    const dbConfig = {
        host: 'localhost',
        user: 'root',
        password: '',
        database: code // Use the business code as the database name
    };
    const connection = mysql.createConnection(dbConfig);
    connection.connect(err => {
        if (err) {
            console.error('Error connecting to MySQL:', err);
            return;
        }
        console.log(`Connected to MySQL DB: ${code}`);
    });
    activeConnections.set(code, connection);
    return connection;
};

// Middleware to validate database code
app.use('/api/:code', (req, res, next) => {
    const { code } = req.params;
    if (!activeConnections.has(code)) {
        const connection = getDbConnection(code);
        if (!connection) {
            return res.status(400).json({ success: false, message: `Invalid database code: ${code}` });
        }
    }
    next();
});

// Endpoint to create a new account
app.post('/api/:code/signup', (req, res) => {
    const { code } = req.params;
    const { fullname, password } = req.body;
    const role_id = 1; // Default to "user" role

    const sql = 'INSERT INTO accounts (fullname, password, role_id, is_active) VALUES (?, ?, ?, 0)';
    const connection = getDbConnection(code);
    connection.query(sql, [fullname, password, role_id], (err) => {
        if (err) {
            console.error('Error creating account:', err);
            return res.status(500).json({ success: false, message: 'Failed to create account' });
        }
        res.json({ success: true, message: 'Account created successfully' });
    });
});

// Endpoint to log in a user
app.post('/api/:code/login', (req, res) => {
    const { code } = req.params;
    const { fullname, password } = req.body;

    const sql = 'SELECT * FROM accounts WHERE fullname = ? AND password = ?';
    const connection = getDbConnection(code);
    connection.query(sql, [fullname, password], (err, results) => {
        if (err) {
            console.error('Error during login:', err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        if (results.length > 0) {
            res.json({ success: true, user: results[0] });
        } else {
            res.json({ success: false, message: 'Invalid username or password' });
        }
    });
});

// Endpoint to start a shift
app.post('/api/:code/start_shift/:id', (req, res) => {
    const { code, id } = req.params;

    const sql = 'INSERT INTO shifts (user_id, sign_in, is_hidden) VALUES (?, NOW(), 0)';
    const connection = getDbConnection(code);
    connection.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error starting shift:', err);
            return res.status(500).json({ success: false, message: 'Failed to start shift' });
        }
        res.json({ success: true, shift_id: result.insertId, message: 'Shift started' });
    });
});

// Endpoint to end a shift
app.post('/api/:code/end_shift/:id', (req, res) => {
    const { code, id } = req.params;

    const fetchSql = 'SELECT sign_in FROM shifts WHERE user_id = ? AND sign_out IS NULL';
    const connection = getDbConnection(code);
    connection.query(fetchSql, [id], (err, results) => {
        if (err) {
            console.error('Error fetching active shift:', err);
            return res.status(500).json({ success: false, message: 'Failed to fetch active shift' });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'No active shift found' });
        }

        const signInTime = new Date(results[0].sign_in);
        const signOutTime = new Date();
        const totalHour = ((signOutTime - signInTime) / 3600000).toFixed(2);

        const updateSql = 'UPDATE shifts SET sign_out = NOW(), total_hour = ? WHERE user_id = ? AND sign_out IS NULL';
        connection.query(updateSql, [totalHour, id], (updateErr) => {
            if (updateErr) {
                console.error('Error ending shift:', updateErr);
                return res.status(500).json({ success: false, message: 'Failed to end shift' });
            }
            res.json({ success: true, message: 'Shift ended successfully' });
        });
    });
});

// Endpoint to edit payment status
app.put('/api/:code/edit_payment_status/:id', (req, res) => {
    const { code, id } = req.params;

    const fetchSql = 'SELECT payment_status FROM shifts WHERE id = ?';
    const connection = getDbConnection(code);
    connection.query(fetchSql, [id], (err, results) => {
        if (err) {
            console.error('Error fetching payment status:', err);
            return res.status(500).json({ success: false, message: 'Failed to fetch payment status' });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Shift not found' });
        }

        const newStatus = results[0].payment_status === 1 ? 0 : 1;
        const updateSql = 'UPDATE shifts SET payment_status = ? WHERE id = ?';
        connection.query(updateSql, [newStatus, id], (updateErr) => {
            if (updateErr) {
                console.error('Error updating payment status:', updateErr);
                return res.status(500).json({ success: false, message: 'Failed to update payment status' });
            }
            res.json({ success: true, message: 'Payment status updated successfully' });
        });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
