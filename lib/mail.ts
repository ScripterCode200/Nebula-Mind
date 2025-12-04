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
            from: '"Nebula Mind" <codstom@gmail.com>',
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
                        
                        @keyframes float {
                            0% { transform: translateY(0px); }
                            50% { transform: translateY(-5px); }
                            100% { transform: translateY(0px); }
                        }

                        .otp-box {
                            animation: pulse 3s infinite ease-in-out;
                        }
                        
                        .logo-text {
                            animation: float 4s infinite ease-in-out;
                        }
                        
                        .feature-icon {
                            transition: transform 0.3s ease;
                        }
                        .feature-icon:hover {
                            transform: scale(1.1);
                        }
                    </style>
                </head>
                <body style="margin: 0; padding: 0; background-color: #000000; font-family: 'Outfit', 'Segoe UI', sans-serif;">
                    <div style="background-color: #000000; padding: 40px 0;">
                        <div style="max-width: 600px; margin: 0 auto; background: #0a0a0a; border-radius: 24px; overflow: hidden; border: 1px solid #222; position: relative;">
                            
                            <!-- Animated Top Bar -->
                            <div style="height: 4px; width: 100%; background: linear-gradient(90deg, #ff0080, #7928ca, #00f0ff); background-size: 200% 200%;"></div>

                            <!-- Header -->
                            <div style="padding: 40px 20px; text-align: center; background: radial-gradient(circle at top, #1a1a1a 0%, #0a0a0a 70%);">
                                <div class="logo-text" style="display: inline-block;">
                                    <h1 style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -1px; color: #fff; text-transform: uppercase;">
                                        Nebula <span style="color: #00f0ff;">Mind</span>
                                    </h1>
                                    <div style="height: 2px; width: 40px; background: #00f0ff; margin: 10px auto 0; border-radius: 2px;"></div>
                                </div>
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

                            <!-- Dynamic Features Grid -->
                            <div style="background: #111; padding: 40px 30px; border-top: 1px solid #222;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center" style="padding-bottom: 20px;">
                                            <span style="background: linear-gradient(90deg, #00f0ff, #7928ca); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">Level Up Your Learning</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <table width="100%" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td width="33%" style="padding: 10px; text-align: center;">
                                                        <div style="background: #1a1a1a; padding: 15px; border-radius: 12px; border: 1px solid #333;">
                                                            <div style="font-size: 24px; margin-bottom: 5px;">🚀</div>
                                                            <div style="color: #fff; font-size: 12px; font-weight: 600;">AI Boost</div>
                                                        </div>
                                                    </td>
                                                    <td width="33%" style="padding: 10px; text-align: center;">
                                                        <div style="background: #1a1a1a; padding: 15px; border-radius: 12px; border: 1px solid #333;">
                                                            <div style="font-size: 24px; margin-bottom: 5px;">⚡</div>
                                                            <div style="color: #fff; font-size: 12px; font-weight: 600;">Instant</div>
                                                        </div>
                                                    </td>
                                                    <td width="33%" style="padding: 10px; text-align: center;">
                                                        <div style="background: #1a1a1a; padding: 15px; border-radius: 12px; border: 1px solid #333;">
                                                            <div style="font-size: 24px; margin-bottom: 5px;">🛡️</div>
                                                            <div style="color: #fff; font-size: 12px; font-weight: 600;">Secure</div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                                
                                <div style="text-align: center; margin-top: 30px;">
                                    <a href="https://nebula-mind.com" style="background: #fff; color: #000; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 800; font-size: 14px; display: inline-block; transition: all 0.3s ease; box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);">EXPLORE NEBULA</a>
                                </div>
                            </div>

                            <!-- Footer -->
                            <div style="background: #000; padding: 20px; text-align: center; border-top: 1px solid #222;">
                                <p style="color: #444; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Nebula Mind System</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `
        });
        return true;
    } catch (error) {
        console.error('Email sending failed:', error);
        return false;
    }
};

export const sendPasswordResetEmail = async (email: string, resetLink: string) => {
    try {
        await transporter.sendMail({
            from: '"Nebula Mind" <codstom@gmail.com>',
            to: email,
            subject: 'Reset Your Password - Nebula Mind',
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
                        
                        @keyframes float {
                            0% { transform: translateY(0px); }
                            50% { transform: translateY(-5px); }
                            100% { transform: translateY(0px); }
                        }

                        .btn-glow {
                            animation: pulse 3s infinite ease-in-out;
                        }
                        
                        .logo-text {
                            animation: float 4s infinite ease-in-out;
                        }
                    </style>
                </head>
                <body style="margin: 0; padding: 0; background-color: #000000; font-family: 'Outfit', 'Segoe UI', sans-serif;">
                    <div style="background-color: #000000; padding: 40px 0;">
                        <div style="max-width: 600px; margin: 0 auto; background: #0a0a0a; border-radius: 24px; overflow: hidden; border: 1px solid #222; position: relative;">
                            
                            <!-- Animated Top Bar -->
                            <div style="height: 4px; width: 100%; background: linear-gradient(90deg, #ff0080, #7928ca, #00f0ff); background-size: 200% 200%;"></div>

                            <!-- Header -->
                            <div style="padding: 40px 20px; text-align: center; background: radial-gradient(circle at top, #1a1a1a 0%, #0a0a0a 70%);">
                                <div class="logo-text" style="display: inline-block;">
                                    <h1 style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -1px; color: #fff; text-transform: uppercase;">
                                        Nebula <span style="color: #00f0ff;">Mind</span>
                                    </h1>
                                    <div style="height: 2px; width: 40px; background: #00f0ff; margin: 10px auto 0; border-radius: 2px;"></div>
                                </div>
                            </div>

                            <!-- Content -->
                            <div style="padding: 20px 40px 40px; text-align: center;">
                                <h2 style="color: #fff; margin-top: 0; font-weight: 600;">Reset Your Password</h2>
                                <p style="color: #888; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                                    We received a request to reset the password for your Nebula Mind account.
                                </p>
                                
                                <a href="${resetLink}" class="btn-glow" style="background: linear-gradient(90deg, #00f0ff, #00aaff); color: #000; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-weight: 800; font-size: 16px; display: inline-block; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 1px;">
                                    Reset Password
                                </a>
                                
                                <p style="color: #555; font-size: 13px; margin: 0;">Link expires in 1 hour • If you didn't ask for this, ignore this email.</p>
                            </div>

                            <!-- Dynamic Features Grid -->
                            <div style="background: #111; padding: 40px 30px; border-top: 1px solid #222;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center" style="padding-bottom: 20px;">
                                            <span style="background: linear-gradient(90deg, #00f0ff, #7928ca); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">Secure Your Second Brain</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <table width="100%" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td width="33%" style="padding: 10px; text-align: center;">
                                                        <div style="background: #1a1a1a; padding: 15px; border-radius: 12px; border: 1px solid #333;">
                                                            <div style="font-size: 24px; margin-bottom: 5px;">🔒</div>
                                                            <div style="color: #fff; font-size: 12px; font-weight: 600;">Encrypted</div>
                                                        </div>
                                                    </td>
                                                    <td width="33%" style="padding: 10px; text-align: center;">
                                                        <div style="background: #1a1a1a; padding: 15px; border-radius: 12px; border: 1px solid #333;">
                                                            <div style="font-size: 24px; margin-bottom: 5px;">⚡</div>
                                                            <div style="color: #fff; font-size: 12px; font-weight: 600;">Fast</div>
                                                        </div>
                                                    </td>
                                                    <td width="33%" style="padding: 10px; text-align: center;">
                                                        <div style="background: #1a1a1a; padding: 15px; border-radius: 12px; border: 1px solid #333;">
                                                            <div style="font-size: 24px; margin-bottom: 5px;">🧠</div>
                                                            <div style="color: #fff; font-size: 12px; font-weight: 600;">Smart</div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    
                                    <div style="text-align: center; margin-top: 30px;">
                                        <a href="https://nebula-mind.com" style="background: #fff; color: #000; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 800; font-size: 14px; display: inline-block; transition: all 0.3s ease; box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);">VISIT WEBSITE</a>
                                    </div>
                                </div>

                                <!-- Footer -->
                                <div style="background: #000; padding: 20px; text-align: center; border-top: 1px solid #222;">
                                    <p style="color: #444; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Nebula Mind System</p>
                                </div>
                            </div>
                        </div>
                    </body>
                    </html>
                `
        });
        return true;
    } catch (error) {
        console.error('Email sending failed:', error);
        return false;
    }
};
