// VER 3.0 (Fixing Online cloud database system management, allow multiple businesses to opt in with tokenized personal accessibility)
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const app = express();
const path = require('path'); // Importing the path module
const port = 3006;

app.use(bodyParser.json());

// Serve static files from the "public" directory, hosting web
app.use(express.static(path.join(__dirname, 'public')));


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