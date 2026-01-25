const nodemailer = require('nodemailer');

// Configure transporter
// NOTE: In production, use environment variables for these values
// Configure transporter
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    debug: true,
    logger: true
});

async function sendVerificationEmail(email, verificationLink) {
    // const verificationLink = ... (removed)

    const mailOptions = {
        from: '"Zë Luxury Fashion" <no-reply@zefashion.com>',
        to: email,
        subject: 'Verify Your Email Address',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Welcome to Zë Luxury Fashion</h2>
                <p>Thank you for signing up. Please verify your email address to activate your account.</p>
                <p style="margin: 20px 0;">
                    <a href="${verificationLink}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
                </p>
                <p style="font-size: 12px; color: #666;">If you didn't create an account, you can ignore this email.</p>
                <p style="font-size: 12px; color: #888;">Link: ${verificationLink}</p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Verification email sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        if (nodemailer.getTestMessageUrl(info)) {
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        }
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}

async function sendGiftNotification(to, giftMessage, senderName, items) {
    const itemsHtml = items.map(item => `
        <div style="border-bottom: 1px solid #eee; padding: 10px 0; display: flex; align-items: center;">
            <img src="${item.image || 'https://via.placeholder.com/60'}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; margin-right: 15px;">
            <div>
                <p style="margin: 0; font-weight: bold; color: #333;">${item.title}</p>
                <p style="margin: 5px 0 0; color: #777; font-size: 14px;">Qty: ${item.quantity}</p>
            </div>
        </div>
    `).join('');

    const mailOptions = {
        from: '"Zë Luxury Fashion" <no-reply@zefashion.com>',
        to: to,
        subject: `You've received a gift from ${senderName}!`,
        html: `
            <div style="font-family: 'Times New Roman', serif; max-width: 600px; margin: 0 auto; background-color: #fff; color: #000;">
                <div style="background-color: #000; color: #fff; padding: 20px; text-align: center;">
                    <h1 style="margin: 0; letter-spacing: 2px;">ZË</h1>
                </div>
                <div style="padding: 40px 20px;">
                    <h2 style="color: #AB7D7D; text-align: center; font-size: 24px;">A Gift For You</h2>
                    <p style="font-size: 16px; line-height: 1.6; text-align: center; color: #333;">
                        Hello! <span style="font-weight: bold;">${senderName}</span> has sent you a special gift from Zë Luxury Fashion.
                    </p>
                    
                    ${giftMessage ? `
                    <div style="background-color: #f9f9f9; border-left: 4px solid #AB7D7D; padding: 20px; margin: 30px 0; font-style: italic; color: #555;">
                        "${giftMessage}"
                    </div>
                    ` : ''}

                    <h3 style="border-bottom: 1px solid #000; padding-bottom: 10px; margin-top: 40px;">Gift Details</h3>
                    <div style="margin-top: 20px;">
                        ${itemsHtml}
                    </div>

                    <div style="text-align: center; margin-top: 40px;">
                        <a href="http://localhost:5500/signin.html" style="background-color: #000; color: #fff; padding: 15px 30px; text-decoration: none; display: inline-block; font-family: sans-serif; letter-spacing: 1px;">VIEW YOUR GIFT</a>
                    </div>
                </div>
                <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #888; font-family: sans-serif;">
                    &copy; 2025 Zë Luxury Fashion. All rights reserved.
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Gift email sent: %s', info.messageId);
        if (nodemailer.getTestMessageUrl(info)) {
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        }
        return true;
    } catch (error) {
        console.error('Error sending gift email:', error);
        return false;
    }
}

async function sendWaitlistWelcome(to, firstName, lastName, ticketId) {
    const mailOptions = {
        from: '"Zë Luxury Fashion" <ze.thebrand@gmail.com>',
        to: to,
        subject: `Welcome to the Zë Waitlist, ${firstName}!`,
        attachments: [{
            filename: 'Logo.png',
            path: __dirname + '/../images/Logo.png',
            cid: 'logo' // same cid value as in the html img src
        }],
        html: `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; color: #000000; padding: 20px;">
                
                <div style="text-align: center; margin-bottom: 30px;">
                   <img src="cid:logo" alt="ZE Logo" style="width: 150px; height: auto;">
                </div>

                <p style="font-size: 16px; margin-bottom: 20px;">Hello <strong>${firstName}</strong>,</p>

                <p style="font-size: 16px; margin-bottom: 20px; line-height: 1.5;">
                    Welcome to something different. Your registration for the <strong>ZË Fashion × Creativity Exhibition — STILL</strong> is officially confirmed and we're thrilled to have you.
                </p>

                <p style="font-size: 16px; margin-bottom: 30px; line-height: 1.5;">
                    This isn't just another event. It's an immersive experience — a moment where creativity, fashion, art, and atmosphere come alive in a way Abuja has never seen before.
                </p>

                <h3 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">Event Details</h3>

                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
                    <p style="margin: 5px 0; font-size: 14px;"><strong>Date:</strong> Dec 15, 2025</p>
                    <p style="margin: 5px 0; font-size: 14px;"><strong>Time:</strong> 12.00 PM</p>
                    <p style="margin: 5px 0; font-size: 14px;"><strong>Location:</strong> The Commune Studio, Abuja</p>
                    <p style="margin: 5px 0; font-size: 14px;"><strong>Guest:</strong> ${firstName} ${lastName}</p>
                    <p style="margin: 5px 0; font-size: 14px;"><strong>Ticket Type:</strong> General Entry</p>
                    <p style="margin: 5px 0; font-size: 14px;"><strong>Ticket ID:</strong> ${ticketId}</p>
                    <p style="margin: 5px 0; font-size: 14px;"><strong>Amount Paid:</strong> ₦0 (Free Entry)</p>
                </div>

                <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #888;">
                     &copy; 2025 Zë Luxury Fashion.
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Waitlist email sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending waitlist email:', error);
        return false;
    }
}

module.exports = { sendVerificationEmail, sendGiftNotification, sendWaitlistWelcome };
