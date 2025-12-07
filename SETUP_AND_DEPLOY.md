# Setup and Deploy

## Prerequisites
- Node.js (v14 or higher)
- npm

## Installation

1.  **Backend Setup:**
    ```bash
    cd backend
    npm install
    ```

2.  **Frontend Setup:**
    ```bash
    cd ze-fashion-brand
    # No npm install needed for vanilla JS frontend, but ensure images are present
    ```

## Database Setup
The project uses SQLite. To initialize the database and seed it with default data (admin user, categories, sample products):

```bash
cd backend
node migrate.js
```

## Running the Application

1.  **Start the Backend Server:**
    ```bash
    cd backend
    npm start
    ```
    The backend will run on `http://localhost:4000`.

2.  **Access the Frontend:**
    Open `http://localhost:4000` in your browser. The backend is configured to serve the frontend static files.

## Admin Access
- **URL:** `http://localhost:4000/signin.html`
- **Email:** `admin@noir123.com`
- **Password:** `admin123`

## Features
- **User Auth:** Sign up and Sign in.
- **Products:** Browse collections, filter, and view product details.
- **Cart:** Add items to cart (synced with backend for logged-in users).
- **Admin:** Manage products (add/delete) and view orders.

## Troubleshooting
- If images are missing, ensure they are in `ze-fashion-brand/images/`.
- If database errors occur, delete `backend/db.sqlite` and run `node migrate.js` again.
