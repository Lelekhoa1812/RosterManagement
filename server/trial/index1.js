// VER 2.0 (Online cloud database system management, allow multiple businesses to opt in with tokenized personal accessibility)
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const app = express();
const path = require('path'); // Importing the path module
const bcrypt = require('bcrypt'); // Usage of encrypt and decrypt library
const port = 3000;

app.use(bodyParser.json());

// Serve static files from the "public" directory, hosting web
app.use(express.static(path.join(__dirname, 'public')));

// Helper function to create a connection for a specific business code
function createDbConnection(code) {
    return mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: code
    });
}

// Middleware to ensure that 'code' is provided and create the connection
app.use((req, res, next) => {
    const { code } = req.body || req.query;
    if (!code) {
        return res.status(400).json({ success: false, message: 'Business code is required' });
    }
    req.dbConnection = createDbConnection(code);
    next();
});

// APP SERVER
// Endpoint to fetch and connect to the database with the provided code
app.post('/api/fetch_business_code', (req, res) => {
    const { code } = req.body;
    const db1Scoped = req.dbConnection;

    db1Scoped.connect(err => {
        if (err) {
            console.error('Error connecting to MySQL:', err);
            res.status(500).json({ success: false, valid: false, message: 'Error connecting to database' });
            return;
        } else {
            console.log('Connected to MySQL DB1: ' + code);
            res.json({ success: true, valid: true, message: 'Database connection successful' });
            db1Scoped.end(); // Close the connection immediately after confirmation
        }
    });
});
    
// User login
app.post('/api/login', (req, res) => {
    // console.log('Login at DB1: ' + code);
    const { fullname, password } = req.body;
    if (!code) {
        res.status(400).json({ success: false, message: 'Business code is required' });
        return;
    }
    const db1Scoped = req.dbConnection;
    const sql = 'SELECT * FROM accounts WHERE fullname = ? AND password = ?';
    db1Scoped.query(sql, [fullname, password], (err, results) => {
        db1Scoped.end(); // Close the connection after the query
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
    const db1Scoped = req.dbConnection;
    const sql = 'INSERT INTO accounts (fullname, password, role_id, is_active) VALUES (?, ?, ?, 0)';
    db1Scoped.query(sql, [fullname, password, role_id], (err, result) => {
        db1Scoped.end(); // Close the connection after the query
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
    const db1Scoped = req.dbConnection;
    const sql = 'SELECT * FROM accounts WHERE id = ?';
    db1Scoped.query(sql, [userId], (err, results) => {
        db1Scoped.end(); // Close the connection after the query
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
    const db1Scoped = req.dbConnection;
    const insertSql = 'INSERT INTO shifts (user_id, sign_in, is_hidden) VALUES (?, NOW(), 0)';
    console.log('Executing SQL:', insertSql, 'with user_id:', user_id);
    db1Scoped.query(insertSql, [user_id], (err, result) => {
        db1Scoped.end(); // Close the connection after the query
        if (err) {
            console.error('Error inserting shift:', err);
            res.status(500).json({ success: false, message: 'Failed to start shift' });
            return;
        }
        // Retrieve the ID of the newly inserted shift
        const shiftId = result.insertId;
        console.log('Shift inserted, ID:', shiftId);
        const updateSql = 'UPDATE accounts SET is_active = 1 WHERE id = ?';
        db1Scoped.query(updateSql, [user_id], (updateErr) => {
            db1Scoped.end(); // Close the connection after the query
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
    const db1Scoped = req.dbConnection;
    // Fetch the sign_in time
    const fetchSql = 'SELECT sign_in FROM shifts WHERE user_id = ? AND sign_out IS NULL';
    db1Scoped.query(fetchSql, [user_id], (err, results) => {
        db1Scoped.end(); // Close the connection after the query
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
        db1Scoped.query(updateSql, [total_hour, user_id], (updateErr) => {
            db1Scoped.end(); // Close the connection after the query
            if (updateErr) throw updateErr;
            // Update accounts to set is_active = 0
            const accountsUpdateSql = 'UPDATE accounts SET is_active = 0 WHERE id = ?';
            db1Scoped.query(accountsUpdateSql, [user_id], (accountsUpdateErr) => {
                db1Scoped.end(); // Close the connection after the query
                if (accountsUpdateErr) throw accountsUpdateErr;

                res.json({ success: true, message: 'Shift ended' });
            });
        });
    });
});


// Update fetching shift backend API with filter function to the staff's fullname
app.get('/api/shifts', (req, res) => {
    const { staff_name, from_date, to_date } = req.query;
    const db1Scoped = req.dbConnection;

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
    db1Scoped.query(sql, (err, result) => {
        db1Scoped.end(); // Close the connection after the query
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
    const db1Scoped = req.dbConnection;
    const sql = 'SELECT fullname FROM accounts WHERE id != 1';
    db1Scoped.query(sql, (err, results) => {
        db1Scoped.end(); // Close the connection after the query
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
    const db1Scoped = req.dbConnection;
    if (!shift_id || sign_in === undefined || sign_out === undefined) {
        return res.status(400).json({ success: false, message: 'Missing shift_id or timing parameter' });
    }
    // SQL query to fetch existing sign_in and sign_out
    const fetchSql = 'SELECT sign_in, sign_out FROM shifts WHERE id = ?';
    db1Scoped.query(fetchSql, [shift_id], (err, results) => {
        db1Scoped.end(); // Close the connection after the query
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
        // New
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
        db1Scoped.query(updateSql, [newSignInDateTime, newSignOutDateTime, total_hour, shift_id], (err, result) => {
            db1Scoped.end(); // Close the connection after the query
            if (err) throw err;
            res.json({ success: true, message: 'Shift edited successfully' });
        });
    });
});



// Edit payment status
app.put('/api/edit_payment_status', (req, res) => {
    const { shift_id } = req.body;
    const db1Scoped = req.dbConnection;
    if (!shift_id) {
        return res.status(400).json({ success: false, message: 'Shift ID is required' });
    }
    // Fetch current payment status from the database
    const query = 'SELECT payment_status FROM shifts WHERE id = ?';
    db1Scoped.query(query, [shift_id], (error, results) => {
        db1Scoped.end(); // Close the connection after the query
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
        db1Scoped.query(updateQuery, [newStatus, shift_id], (updateError) => {
            db1Scoped.end(); // Close the connection after the query
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
    const db1Scoped = req.dbConnection;
    if (!id || !note) {
        return res.status(400).json({ success: false, message: 'Missing id or note' });
    }
    console.log(`id: ${id} with note: ${note}.`); // Debug message

    const query = 'UPDATE shifts SET note = ? WHERE id = ?';
    db1Scoped.query(query, [note, id], (err, result) => {
        db1Scoped.end(); // Close the connection after the query
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
    const db1Scoped = req.dbConnection;
    if (!shift_id || is_hidden === undefined) {
        return res.status(400).json({ success: false, message: 'Missing shift_id or is_hidden parameter' });
    }
    const updateQuery = 'UPDATE shifts SET is_hidden = ? WHERE id = ?';
    db1Scoped.query(updateQuery, [is_hidden, shift_id], (err, result) => {
        db1Scoped.end(); // Close the connection after the query
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
    const db1Scoped = req.dbConnection;
    if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    // Update new account details info body
    const updates = {};
    if (fullname) updates.fullname = fullname;
    if (password) updates.password = password;

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, message: 'At least one field is required' });
    }
    db1Scoped.query(
        'UPDATE accounts SET ? WHERE id = ?',
        [updates, userId],
        (error, results) => {
            db1Scoped.end(); // Close the connection after the query
            if (error) {
                console.error(error);
                return res.status(500).json({ success: false, message: 'Failed to update account' });
            }
            res.json({ success: true, message: 'Account updated successfully' });
        }
    );
});



// WEB SERVER
const db2 = mysql.createConnection({
    host: 'localhost',
    user: 'root', // use your MySQL username
    password: '', // use your MySQL password
    database: 'BusinessDetails'
});

db2.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to MySQL DB2');
});

// encrypted message
// btoa(string) to encode
// atob(string) to decode

// Create new account unique code
function generateUniqueCode(callback) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code;
    let isUnique = false;

    function checkCode() {
        code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        db2.query('SELECT code FROM BusinessDetails.businesses WHERE code = ?', [code], (err, results) => {
            if (err) {
                return callback(err, null);
            }
            if (results.length === 0) {
                isUnique = true;
                callback(null, code);
            } else {
                checkCode();
            }
        });
    }
    checkCode();
}


// Create a new database with name based to the code variable initialized upon new user sign up 
const createDatabaseAndTables = (code, callback) => {
    const dbName = code;
    // SQL statements to create database
    const createDbSQL = `CREATE DATABASE ${dbName}`;
    // SQL statements to create tables and insert default values
    // Database sample found at src/RosterManagement.sql
    const useDbSQL = `USE ${dbName}`;
    // Init tables of roles, accounts and shifts format
        const createRolesTableSQL = `
        CREATE TABLE IF NOT EXISTS roles (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(20) NOT NULL
        );
    `;
    const createAccountsTableSQL = `
        CREATE TABLE IF NOT EXISTS accounts (
            id INT PRIMARY KEY AUTO_INCREMENT,
            fullname VARCHAR(100) NOT NULL,
            password VARCHAR(100) NOT NULL,
            role_id INT,
            is_active TINYINT(1) DEFAULT 0,
            FOREIGN KEY (role_id) REFERENCES roles(id)
        );
    `;
    const createShiftsTableSQL = `
        CREATE TABLE IF NOT EXISTS shifts (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT,
            fullname VARCHAR(100),
            sign_in DATETIME,
            sign_out DATETIME,
            total_hour FLOAT,
            payment_status TINYINT(1) DEFAULT 0,
            is_hidden TINYINT(1) DEFAULT 0,
            note VARCHAR(30),
            FOREIGN KEY (user_id) REFERENCES accounts(id)
        );
    `;
    const insertRolesSQL = `
        INSERT INTO roles (name) VALUES ('user'), ('admin');
    `;
    const insertAdminSQL = `
        INSERT INTO accounts (fullname, password, role_id, is_active) VALUES ('Admin', '1234', 2, 0);
    `;
    // Execute the SQL statements (with errors returned)
    db2.query(createDbSQL, (err, results) => {
        if (err) {
            console.error('Error creating database:', err);
            return callback(err);
        }
        db2.query(useDbSQL, (err, results) => {
            if (err) {
                console.error('Error using database:', err);
                return callback(err);
            }
            db2.query(createRolesTableSQL, (err) => {
                if (err) {
                    console.error('Error creating roles table:', err);
                    return callback(err);
                }
                db2.query(createAccountsTableSQL, (err) => {
                    if (err) {
                        console.error('Error creating accounts table:', err);
                        return callback(err);
                    }
                    db2.query(createShiftsTableSQL, (err) => {
                        if (err) {
                            console.error('Error creating shifts table:', err);
                            return callback(err);
                        }
                        db2.query(insertRolesSQL, (err) => {
                            if (err) {
                                console.error('Error inserting roles:', err);
                                return callback(err);
                            }
                            db2.query(insertAdminSQL, (err) => {
                                if (err) {
                                    console.error('Error inserting admin account:', err);
                                    return callback(err);
                                }
                                callback(null);
                            });
                        });
                    });
                });
            });
        });
    });
};



// Signup new business account on the website
app.post('/api/business_signup', (req, res) => {
    const { username, password, email } = req.body;

    console.log('Received signup request:', req.body);

    // Validate username
    if (username.length < 4) {
        return res.status(400).json({ error: 'Username must be at least 4 characters long' });
    }
    // Validate password
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    // Validate email
    const emailRegex = /\S+@\S+\.\S+/; // Email should be formatted as someString@someString.someString
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if username or email already exists
    db2.query('SELECT * FROM BusinessDetails.businesses WHERE username = ? OR email = ?', [username, email], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length > 0) {
            console.log('Username or Email already exists');
            return res.status(400).json({ error: 'Username or Email has already been used' });
        }

        // Generate a unique code
        generateUniqueCode((err, code) => {
            if (err) {
                console.error('Error generating unique code:', err);
                return res.status(500).json({ error: 'Error generating unique code' });
            }
            // Encode password before saving to the database
            // password = btoa(password);
            // Insert new business data
            const newBusiness = { username, password, email, code };
            console.log('Inserting new business:', newBusiness);

            db2.query('INSERT INTO BusinessDetails.businesses SET ?', newBusiness, (err, result) => {
                if (err) {
                    console.error('Database error during insert:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                // Create new database and tables
                createDatabaseAndTables(code, (err) => {
                    if (err) {
                        console.error('Error creating database and tables:', err);
                        return res.status(500).json({ error: 'Error creating database and tables' });
                    }
                    console.log('New business inserted with ID:', result.insertId);
                    res.status(201).json({ message: 'Business account created successfully', businessId: result.insertId });
                });
            });
        });
    });
});


// Login with business credential info
app.post('/api/business_login', (req, res) => {
    const { username, password } = req.body;
    // Decode password before login
    // password = atob(password);
    // SQL statement to select code from the BusinessDetails database
    const sql = 'SELECT * FROM BusinessDetails.businesses WHERE username = ? AND password = ?';
    db2.query(sql, [username, password], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            res.status(500).json({ error: 'An error occurred while processing your request.' });
            return;
        }
        if (results.length === 0) {
            res.status(401).json({ error: 'Invalid username or password.' });
            return;
        }
        res.json({
            name: results[0].username,
            code: results[0].code
        });
    });
});


// Endpoint to get business code by username
app.post('/api/get_code', (req, res) => {
    const { username } = req.body;
    const sql = 'SELECT code FROM BusinessDetails.businesses WHERE username = ?';
    db2.query(sql, [username], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            res.status(500).json({ error: 'An error occurred while processing your request.' });
            return;
        }
        if (results.length === 0) {
            res.status(404).json({ error: 'Username not found.' });
            return;
        }
        // Now perform the actual query
        queryWithDatabase_fetchCode('SELECT code FROM BusinessDetails.businesses WHERE username = ?', [username], (err, results) => {
            if (err) {
                console.error('Database query error:', err);
                res.status(500).json({ error: 'An error occurred while processing your request.' });
                return;
            }
            if (results.length === 0) {
                res.status(404).json({ error: 'Username not found.' });
                return;
            }
            res.json({ code: results[0].code });
        });
    });
});


// Function to select the database and run a query, for fetch code
const queryWithDatabase_fetchCode = (sql, params, callback) => {
    const useDbSQL = 'USE BusinessDetails';
    
    db2.query(useDbSQL, (err) => {
        if (err) {
            console.error('Error selecting database:', err);
            return callback(err);
        }
        db2.query(sql, params, (err, results) => {
            if (err) {
                console.error('Database query error:', err);
                return callback(err);
            }
            callback(null, results);
        });
    });
};



// MUTUAL USAGE
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Log request data
app.use((req, res, next) => {
    console.log(`Request Body: ${JSON.stringify(req.body)}`);
    next();
});