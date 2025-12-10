import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL
    auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS
    }
});

export const sendOTP = async (email: string, otp: string) => {
    try {
        await transporter.sendMail({
            from: `"Nebula Mind" <${process.env.NODEMAILER_USER}>`,
            to: email,
            subject: 'Your Access Code - Nebula Mind',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');
                        
                        @keyframes pulse {
                            0% { box-shadow: 0 0 20px rgba(0, 240, 255, 0.2); border-color: rgba(0, 240, 255, 0.4); }
                            50% { box-shadow: 0 0 40px rgba(0, 240, 255, 0.5); border-color: rgba(0, 240, 255, 0.8); }
                            100% { box-shadow: 0 0 20px rgba(0, 240, 255, 0.2); border-color: rgba(0, 240, 255, 0.4); }
                        }
                        
                        .otp-box {
                            animation: pulse 3s infinite ease-in-out;
                        }
                    </style>
                </head>
                <body style="margin: 0; padding: 0; background-color: #000000; font-family: 'Outfit', 'Segoe UI', sans-serif;">
                    <div style="background-color: #000000; padding: 40px 0;">
                        <div style="max-width: 600px; margin: 0 auto; background: #0a0a0a; border-radius: 24px; overflow: hidden; border: 1px solid #222; position: relative;">
                            
                            <!-- Header -->
                            <div style="padding: 40px 20px; text-align: center; background: radial-gradient(circle at top, #1a1a1a 0%, #0a0a0a 70%);">
                                <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #fff; text-transform: uppercase;">
                                    Nebula <span style="color: #00f0ff;">Mind</span>
                                </h1>
                            </div>

                            <!-- OTP Section -->
                            <div style="padding: 20px 40px 40px; text-align: center;">
                                <h2 style="color: #fff; margin-top: 0; font-weight: 600;">Verification Required</h2>
                                <p style="color: #888; font-size: 16px; line-height: 1.6;">Secure access requested for your account.</p>
                                
                                <div class="otp-box" style="background: rgba(0, 240, 255, 0.05); border: 2px solid rgba(0, 240, 255, 0.3); border-radius: 16px; padding: 30px; margin: 30px 0; display: inline-block; min-width: 200px;">
                                    <div style="color: #00f0ff; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; font-weight: 700;">One-Time Password</div>
                                    <div style="font-family: 'Courier New', monospace; font-size: 48px; font-weight: 700; color: #fff; letter-spacing: 8px; text-shadow: 0 0 20px rgba(0, 240, 255, 0.5);">${otp}</div>
                                </div>
                                
                                <p style="color: #555; font-size: 13px; margin: 0;">Expires in 10 minutes • Single use only</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `
        });
        return true;
    } catch (error: any) {
        console.error('Email sending failed:', error.message || error);
        return false;
    }
};

export const sendPasswordResetEmail = async (email: string, resetLink: string) => {
    try {
        await transporter.sendMail({
            from: `"Nebula Mind" <${process.env.NODEMAILER_USER}>`,
            to: email,
            subject: 'Reset Your Password - Nebula Mind',
            html: `
                <!DOCTYPE html>
                <html>
                <body style="margin: 0; padding: 0; background-color: #000;">
                    <p style="color: #fff;">Click here to reset: <a href="${resetLink}">${resetLink}</a></p>
                </body>
                </html>
            `
        });
        return true;
    } catch (error: any) {
        console.error('Email sending failed:', error.message || error);
        return false;
    }
};
