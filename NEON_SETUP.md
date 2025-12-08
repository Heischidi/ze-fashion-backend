# How to Set Up Neon PostgreSQL for Ze Fashion

Since proper database persistence is required for authentication and orders, we are moving from SQLite to **Neon (PostgreSQL)**.

## Phase 1: Create Database on Neon
1.  **Sign Up**: Go to [Neon.tech](https://neon.tech) and sign up (it's free).
2.  **Create Project**:
    *   Click **"New Project"**.
    *   Name it `ze-fashion-db`.
    *   Region: Choose one closest to your customers (e.g., `US East (Ohio)` or `Europe (Frankfurt)`).
    *   Click **"Create Project"**.
3.  **Get Connection String**:
    *   On the **Dashboard**, look for the **"Connection Details"** section.
    *   Ensure the toggle is set to **"Pooled"** (optional but good for serverless) or **"Direct"**.
    *   Copy the connection string. It looks like:
        ```
        postgres://neondb_owner:AbC123xyz@ep-cool-project.us-east-2.aws.neon.tech/neondb?sslmode=require
        ```

## Phase 2: Add to Render
1.  Login to your [Render Dashboard](https://dashboard.render.com).
2.  Select your backend service (`ze-fashion-backend`).
3.  Click on **"Environment"** in the sidebar.
4.  Click **"Add Environment Variable"**.
5.  **Key**: `DATABASE_URL`
6.  **Value**: (Paste the Neon connection string you copied).
7.  Click **"Save Changes"**.

## Phase 3: Verify
Render will usually restart your service automatically when environment variables change.
1.  Go to **"Logs"**.
2.  Watch for the deployment.
3.  You should see logs from our migration script:
    ```
    Starting migration to PostgreSQL...
    Tables created.
    Admin user created...
    Categories seeded
    Seeded X products
    Migration & Seeding complete
    Server running on port 10000
    ```
4.  Once running, try **Sign Up** on your frontend. It should work without "Database error".
