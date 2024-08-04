const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(bodyParser.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'RosterManagement'
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    } 
    console.log('Connected to MySQL');
});


// User login
app.post('/api/login', (req, res) => {
    const { fullname, password } = req.body;
    const sql = 'SELECT * FROM accounts WHERE fullname = ? AND password = ?';
    db.query(sql, [fullname, password], (err, results) => {
        if (err) {
            console.error('Error during login:', err);
            res.status(500).json({ success: false, message: 'Internal server error' });
            return;
        }
        if (results.length > 0) {
            res.json({ success: true, user: results[0] });
        } else {
            res.json({ success: false, message: 'Wrong username or password' });
        }
    });
});


// Create new account
app.post('/api/signup', (req, res) => {
    const { fullname, password } = req.body;
    const role_id = 1; // Assuming 1 is the role_id for 'user'
    const sql = 'INSERT INTO accounts (fullname, password, role_id, is_active) VALUES (?, ?, ?, 0)';
    db.query(sql, [fullname, password, role_id], (err, result) => {
        if (err) {
            console.error('Error creating account:', err);
            res.status(500).json({ success: false, message: 'Failed to create account' });
            return;
        }
        res.json({ success: true, message: 'Account created successfully' });
    });
});


// Fetch user details (id to be any fields selected from the 'accounts' table)
app.get('/api/accounts/:id', (req, res) => {
    const userId = req.params.id;
    const sql = 'SELECT * FROM accounts WHERE id = ?';
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user details:', err);
            res.status(500).json({ success: false, message: 'Failed to fetch user details' });
            return;
        }
        if (results.length > 0) {
            res.json({ success: true, account: results[0] });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    });
});


// Start shift
app.post('/api/start_shift', (req, res) => {
    const { user_id } = req.body;
    const insertSql = 'INSERT INTO shifts (user_id, sign_in, is_hidden) VALUES (?, NOW(), 0)';
    console.log('Executing SQL:', insertSql, 'with user_id:', user_id);

    db.query(insertSql, [user_id], (err, result) => {
        if (err) {
            console.error('Error inserting shift:', err);
            res.status(500).json({ success: false, message: 'Failed to start shift' });
            return;
        }

        // Retrieve the ID of the newly inserted shift
        const shiftId = result.insertId;
        console.log('Shift inserted, ID:', shiftId);

        const updateSql = 'UPDATE accounts SET is_active = 1 WHERE id = ?';
        db.query(updateSql, [user_id], (updateErr) => {
            if (updateErr) {
                console.error('Error updating account status:', updateErr);
                res.status(500).json({ success: false, message: 'Failed to update account status' });
                return;
            }

            res.json({ success: true, shift_id: shiftId, message: 'Shift started' });
        });
    });
});



// End shift
app.post('/api/end_shift', (req, res) => {
    const { user_id } = req.body;

    // Fetch the sign_in time
    const fetchSql = 'SELECT sign_in FROM shifts WHERE user_id = ? AND sign_out IS NULL';
    db.query(fetchSql, [user_id], (err, results) => {
        if (err) throw err;

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'No active shift found for this user' });
        }

        const signInTime = new Date(results[0].sign_in);
        const signOutTime = new Date(); // Current time as sign-out time

        // Calculate total hours worked
        let total_hour = (signOutTime - signInTime) / 3600000;

        // Round to 2 decimal places
        total_hour = Math.round(total_hour * 100) / 100;

        // Ensure total_hour is a valid number
        if (isNaN(total_hour)) {
            return res.status(400).json({ success: false, message: 'Invalid calculation for total hours' });
        }

        // Update shift with calculated total_hours and current sign_out time
        const updateSql = 'UPDATE shifts SET sign_out = NOW(), total_hour = ? WHERE user_id = ? AND sign_out IS NULL';
        db.query(updateSql, [total_hour, user_id], (updateErr) => {
            if (updateErr) throw updateErr;

            // Update accounts to set is_active = 0
            const accountsUpdateSql = 'UPDATE accounts SET is_active = 0 WHERE id = ?';
            db.query(accountsUpdateSql, [user_id], (accountsUpdateErr) => {
                if (accountsUpdateErr) throw accountsUpdateErr;

                res.json({ success: true, message: 'Shift ended' });
            });
        });
    });
});


// Update fetching shift backend API with filter function to the staff's fullname
app.get('/api/shifts', (req, res) => {
    const { staff_name, from_date, to_date } = req.query;

    let sql = `
        SELECT shifts.*, accounts.fullname 
        FROM shifts 
        JOIN accounts ON shifts.user_id = accounts.id
    `;

    const conditions = [];
    if (staff_name) {
        conditions.push(`accounts.fullname = '${staff_name}'`);
    }
    if (from_date) {
        conditions.push(`shifts.sign_in >= '${from_date}'`);
    }
    if (to_date) {
        conditions.push(`shifts.sign_in <= '${to_date}'`);
    }

    if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY shifts.sign_in DESC';

    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching shifts:', err);
            res.status(500).json({ success: false, message: 'Failed to fetch shifts' });
            return;
        }
        res.json({ success: true, shifts: result });
    });
});


// Get accounts / staff fullname
app.get('/api/accounts', (req, res) => {
    // const sql = 'SELECT fullname FROM accounts';
    const sql = 'SELECT fullname FROM accounts WHERE id != 1';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching accounts:', err);
            res.status(500).json({ success: false, message: 'Failed to fetch accounts' });
            return;
        }
        res.json({ success: true, accounts: results });
    });
});


// The edit_time endpoint, handle update time action as user's request
app.post('/api/edit_time', (req, res) => {
    const { shift_id, sign_in, sign_out } = req.body;

    if (!shift_id || sign_in === undefined || sign_out === undefined) {
        return res.status(400).json({ success: false, message: 'Missing shift_id or timing parameter' });
    }

    // SQL query to fetch existing sign_in and sign_out
    const fetchSql = 'SELECT sign_in, sign_out FROM shifts WHERE id = ?';
    db.query(fetchSql, [shift_id], (err, results) => {
        if (err) throw err;

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Shift not found' });
        }

        const existingSignIn = new Date(results[0].sign_in);
        const existingSignOut = new Date(results[0].sign_out);

        // Extract the date part from existing values
        const datePart = existingSignIn.toISOString().split('T')[0];

        // Combine the date part with the new time part
        const newSignInDateTime = `${datePart} ${sign_in}`;
        const newSignOutDateTime = `${datePart} ${sign_out}`;

        const signInDateTime = new Date(newSignInDateTime);
        const signOutDateTime = new Date(newSignOutDateTime);

        // Calculate total hours worked
        let total_hour = (signOutDateTime - signInDateTime) / 3600000;

        // Round to 2 decimal places
        total_hour = Math.round(total_hour * 100) / 100;

        // Ensure total_hour is a valid number
        if (isNaN(total_hour)) {
            return res.status(400).json({ success: false, message: 'Invalid sign-in or sign-out time' });
        }

        // SQL query to update shift timing
        const updateSql = 'UPDATE shifts SET sign_in = ?, sign_out = ?, total_hour = ? WHERE id = ?';
        db.query(updateSql, [newSignInDateTime, newSignOutDateTime, total_hour, shift_id], (err, result) => {
            if (err) throw err;
            res.json({ success: true, message: 'Shift edited successfully' });
        });
    });
});



// Edit payment status
app.put('/api/edit_payment_status', (req, res) => {
    const { shift_id } = req.body;

    if (!shift_id) {
        return res.status(400).json({ success: false, message: 'Shift ID is required' });
    }

    // Fetch current payment status from the database
    const query = 'SELECT payment_status FROM shifts WHERE id = ?';
    db.query(query, [shift_id], (error, results) => {
        if (error) {
            console.error('Database query error:', error);
            return res.status(500).json({ success: false, message: 'Database query error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Shift not found' });
        }
        const currentStatus = results[0].payment_status;
        const newStatus = currentStatus === 1 ? 0 : 1;
        // Update payment status in the database
        const updateQuery = 'UPDATE shifts SET payment_status = ? WHERE id = ?';
        db.query(updateQuery, [newStatus, shift_id], (updateError) => {
            if (updateError) {
                console.error('Database update error:', updateError);
                return res.status(500).json({ success: false, message: 'Database update error' });
            }

            res.json({ success: true, message: 'Payment status updated successfully' });
        });
    });
});


// Post/Set note to the shift card corresponded to the shift_id (id)
app.post('/api/add_note', (req, res) => {
    const { id, note } = req.body;

    if (!id || !note) {
        return res.status(400).json({ success: false, message: 'Missing id or note' });
    }

    console.log(`id: ${id} with note: ${note}.`); // Debug message

    const query = 'UPDATE shifts SET note = ? WHERE id = ?';
    db.query(query, [note, id], (err, result) => {
        if (err) {
            console.error('Database update error:', err); // Log the error
            return res.status(500).json({ success: false, message: 'Failed to add note' });
        }
        
        console.log('Database update result:', result); // Log the result of the query
        return res.status(200).json({ success: true, message: 'Note added successfully' });
    });
});


// The edit_shift endpoint, handle hide action on admin page
app.put('/api/edit_shift', (req, res) => {
    const { shift_id, is_hidden } = req.body;

    if (!shift_id || is_hidden === undefined) {
        return res.status(400).json({ success: false, message: 'Missing shift_id or is_hidden parameter' });
    }

    const updateQuery = 'UPDATE shifts SET is_hidden = ? WHERE id = ?';

    db.query(updateQuery, [is_hidden, shift_id], (err, result) => {
        if (err) {
            console.error('Failed to update shift:', err);
            return res.status(500).json({ success: false, message: 'Failed to update shift' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Shift not found' });
        }

        res.json({ success: true, message: 'Shift updated successfully' });
    });
});


// Update user's new credential info upon request
app.post('/api/update_account', (req, res) => {
    const { userId, fullname, password } = req.body;

    if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const updates = {};
    if (fullname) updates.fullname = fullname;
    if (password) updates.password = password;

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, message: 'At least one field is required' });
    }

    db.query(
        'UPDATE accounts SET ? WHERE id = ?',
        [updates, userId],
        (error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ success: false, message: 'Failed to update account' });
            }
            res.json({ success: true, message: 'Account updated successfully' });
        }
    );
});



app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});


// Log request data
app.use((req, res, next) => {
    console.log(`Request Body: ${JSON.stringify(req.body)}`);
    next();
});

