CREATE DATABASE RosterManagement;
USE RosterManagement;

CREATE TABLE roles(
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(20) NOT NULL
);

CREATE TABLE accounts(
    id INT PRIMARY KEY AUTO_INCREMENT,
    fullname VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    role_id INT,
    is_active TINYINT(1) DEFAULT 0,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE shifts(
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    fullname VARCHAR(100),
    sign_in DATETIME,
    sign_out DATETIME,
    total_hour FLOAT CHECK(total_hour >= 0),
    payment_status TINYINT(1) DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES accounts(id),
    is_hidden INYINT(1) DEFAULT 0,
    note VARCHAR(30)
);

INSERT INTO accounts(id, fullname, password, role_id, is_active) -- add default admin account, which actual admin can change their preferences
VALUES(1, 'Admin', '1234', 2, 0);

INSERT INTO roles (name) VALUES ('user'), ('admin'); -- adding 2 role names

-- set is_hidden indicating whether the shift card is hidden or not
-- ALTER TABLE shifts ADD COLUMN is_hidden TINYINT(1) DEFAULT 0;
-- adding note to that specific shift card
-- ALTER TABLE shifts ADD COLUMN note VARCHAR(30);

-- Disable foreign key checks
-- SET FOREIGN_KEY_CHECKS = 0;

-- Delete all data from the shifts and accounts tables
-- DELETE FROM shifts;
-- DELETE FROM accounts;

-- Reset auto-increment values
-- ALTER TABLE accounts AUTO_INCREMENT = 1;
-- ALTER TABLE shifts AUTO_INCREMENT = 1;

-- Enable foreign key checks
-- SET FOREIGN_KEY_CHECKS = 1;
