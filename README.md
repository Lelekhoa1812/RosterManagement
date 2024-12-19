# Roster Management Android System

## Overview
The **Roster Management Android System** is a robust mobile application designed to manage business operations efficiently, including shift management, user authentication, and account creation. It supports multiple businesses by allowing unique database setups for each business, identified by a unique business code. This application communicates with a server-side API to manage databases and performs localized database queries directly on the app.

---

## Features

### General
- **Dynamic Database Connection:** Each business can connect to its unique database using a 6-character business code.
- **Role-Based Access:** Supports both admin and user roles with tailored interfaces and functionalities.
- **Local Database Handling:** Direct interaction with SQLite databases to ensure seamless offline operations.

### Functionalities
- **Business Sign-In:** Connect to a business-specific database by entering a unique business code.
- **User Login:** Authenticate users and provide role-based access (admin/user).
- **Account Management:** Create new accounts directly from the app.
- **Shift Management:** Start and end shifts, calculate total hours worked, and manage user activity statuses.

---

## Architecture

### Server-Side API
The app communicates with the server using RESTful API endpoints structured as follows:
- **Business Code-Specific Endpoints:**
  - `/api/:code/signup`: Sign up new users for a specific business.
  - `/api/:code/login`: Authenticate users for a specific business.
  - `/api/:code/endpoint/:id`: User-specific actions like managing shifts.

### Database
Each business has a dedicated SQLite database, dynamically connected by entering the unique business code.

### Android Application
- **Fragments:**
  - `BusinessSignInFragment`: Handles business code input and database connectivity.
  - `CredentialFragment`: Manages user login and role-based redirection.
  - `SignUpFragment`: Facilitates account creation.
- **Database Layer:** Uses `AppDatabase` for localized database queries.

---

## Installation and Setup

### Prerequisites
- Android Studio
- MySQL for server database
- Node.js and npm for server-side API

### Steps
1. **Clone the Repository:**
   ```bash
   git clone https://github.com/YourUsername/RosterManagementSystem.git
   ```
2. **Set Up the Server:**
   - Navigate to the `server` directory.
   - Install dependencies:
     ```bash
     npm install
     ```
   - Start the server:
     ```bash
     node index.js
     ```
3. **Configure the App:**
   - Import the project into Android Studio.
   - Set up the database schema in `src/RosterManagement.sql`.
   - Run the application on an emulator or physical device.

---

## Usage
1. Launch the application.
2. Enter a valid business code to connect to the corresponding database.
3. Log in using your credentials.
4. Navigate through the app to manage shifts, accounts, and other operations based on your role.

---

## Technologies Used
- **Frontend:** Android (Kotlin, XML), Website JS
- **Backend:** Node.js with Express.js
- **Database:** MySQL (server) and SQLite (app)
- **Networking:** RESTful API

---

## License
This project is licensed under the [MIT License](LICENSE).

---

## Future Enhancements
- Add push notifications for shift reminders.
- Implement analytics for admin roles to track employee performance.
- Enhance UI for better user experience.

