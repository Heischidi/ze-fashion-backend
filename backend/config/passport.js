const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { getDb } = require('../db');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const db = await getDb();
        const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const db = await getDb();

            // Check if user exists
            let user = await db.get('SELECT * FROM users WHERE google_id = ?', [profile.id]);

            if (user) {
                return done(null, user);
            }

            // Check if email exists (link account)
            const email = profile.emails[0].value;
            user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

            if (user) {
                // Update existing user with google_id and avatar
                await db.run('UPDATE users SET google_id = ?, avatar = ? WHERE id = ?',
                    [profile.id, profile.photos[0].value, user.id]);
                user.google_id = profile.id;
                user.avatar = profile.photos[0].value;
                return done(null, user);
            }

            // Create new user
            const result = await db.run(
                'INSERT INTO users (name, email, google_id, avatar, is_verified) VALUES (?, ?, ?, ?, 1)',
                [profile.displayName, email, profile.id, profile.photos[0].value]
            );

            user = {
                id: result.lastID,
                name: profile.displayName,
                email: email,
                google_id: profile.id,
                avatar: profile.photos[0].value,
                role: 'customer'
            };

            done(null, user);

        } catch (err) {
            done(err, null);
        }
    }));
} else {
    console.warn("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing. Google Auth disabled.");
}

module.exports = passport;
