import nodemailer from 'nodemailer';

export class EmailService {
    private static transporter: nodemailer.Transporter | null = null;
    private static initialized = false;

    /**
     * Initialize the email transporter.
     * Uses Gmail if credentials are provided, otherwise falls back to Ethereal (test email).
     */
    static async getTransporter(): Promise<nodemailer.Transporter> {
        if (this.transporter && this.initialized) return this.transporter;

        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASS;

        // If real credentials are configured, use Gmail
        if (emailUser && emailPass && !emailUser.includes('your_email') && !emailPass.includes('your_app_password')) {
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: emailUser,
                    pass: emailPass,
                },
            });
            this.initialized = true;
            console.log('📧 Email service: Using Gmail SMTP');
            return this.transporter;
        }

        // Fallback: Create an Ethereal test account (free, no config needed)
        try {
            const testAccount = await nodemailer.createTestAccount();
            this.transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            this.initialized = true;
            console.log('📧 Email service: Using Ethereal test account');
            console.log(`   Ethereal user: ${testAccount.user}`);
            return this.transporter;
        } catch (err) {
            console.warn('⚠️  Email service: Could not create Ethereal account. Emails will be logged to console.');
            // Create a stream transport that just logs to console
            this.transporter = nodemailer.createTransport({
                streamTransport: true,
                newline: 'unix',
            });
            this.initialized = true;
            return this.transporter;
        }
    }

    static async sendWelcomeEmail(email: string, name: string, couponCode: string) {
        const transporter = await this.getTransporter();
        const fromAddress = process.env.EMAIL_USER && !process.env.EMAIL_USER.includes('your_email')
            ? process.env.EMAIL_USER
            : 'noreply@nexmart.com';

        const mailOptions = {
            from: `"NexMart" <${fromAddress}>`,
            to: email,
            subject: '🎉 Welcome to NexMart! Here\'s your exclusive coupon code',
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; border-radius: 16px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #DB1A1A 0%, #ff4444 100%); padding: 40px 32px; text-align: center;">
                        <h1 style="color: #ffffff; font-size: 28px; margin: 0;">Welcome to NexMart!</h1>
                        <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin-top: 8px;">The Premium Tech Marketplace</p>
                    </div>
                    <div style="padding: 32px;">
                        <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6;">Hi <strong style="color: #ffffff;">${name}</strong>,</p>
                        <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6;">Thank you for joining NexMart! We're thrilled to have you as part of our community of tech enthusiasts.</p>
                        
                        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 2px dashed #DB1A1A; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
                            <p style="color: #aaa; font-size: 14px; margin: 0 0 8px;">🎁 YOUR EXCLUSIVE WELCOME COUPON</p>
                            <p style="color: #DB1A1A; font-size: 32px; font-weight: 800; letter-spacing: 4px; margin: 0; font-family: monospace;">${couponCode}</p>
                            <p style="color: #4ade80; font-size: 16px; font-weight: 600; margin: 12px 0 0;">Save 10% on your first purchase!</p>
                        </div>
                        
                        <p style="color: #999; font-size: 14px; line-height: 1.6;">Use this code at checkout to get your discount. This coupon is exclusively yours!</p>
                        
                        <div style="text-align: center; margin-top: 32px;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/products.html" style="background: linear-gradient(135deg, #DB1A1A, #ff4444); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block;">Start Shopping →</a>
                        </div>
                    </div>
                    <div style="background: #111; padding: 20px 32px; text-align: center;">
                        <p style="color: #666; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} NexMart. Premium Tech Marketplace.</p>
                    </div>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        
        // Log Ethereal preview URL if available
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`📧 Welcome email preview: ${previewUrl}`);
        }
    }

    static async sendLoginNotification(email: string, name: string, couponCode: string) {
        const transporter = await this.getTransporter();
        const fromAddress = process.env.EMAIL_USER && !process.env.EMAIL_USER.includes('your_email')
            ? process.env.EMAIL_USER
            : 'noreply@nexmart.com';

        const mailOptions = {
            from: `"NexMart" <${fromAddress}>`,
            to: email,
            subject: '🔐 Login Notification — Your coupon code inside!',
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; border-radius: 16px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px 32px; text-align: center;">
                        <h1 style="color: #ffffff; font-size: 28px; margin: 0;">Welcome Back, ${name}!</h1>
                        <p style="color: rgba(255,255,255,0.7); font-size: 14px; margin-top: 8px;">Login detected at ${new Date().toLocaleString()}</p>
                    </div>
                    <div style="padding: 32px;">
                        <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6;">You have successfully logged in to your NexMart account.</p>
                        
                        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 2px dashed #DB1A1A; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
                            <p style="color: #aaa; font-size: 14px; margin: 0 0 8px;">🏷️ YOUR COUPON CODE</p>
                            <p style="color: #DB1A1A; font-size: 32px; font-weight: 800; letter-spacing: 4px; margin: 0; font-family: monospace;">${couponCode}</p>
                            <p style="color: #4ade80; font-size: 16px; font-weight: 600; margin: 12px 0 0;">10% OFF your next purchase!</p>
                        </div>
                        
                        <p style="color: #999; font-size: 14px; line-height: 1.6;">Apply this coupon code at checkout to save 10% on your order.</p>
                        <p style="color: #666; font-size: 13px; line-height: 1.6;">If you didn't log in, please secure your account immediately.</p>
                        
                        <div style="text-align: center; margin-top: 32px;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/products.html" style="background: linear-gradient(135deg, #DB1A1A, #ff4444); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block;">Continue Shopping →</a>
                        </div>
                    </div>
                    <div style="background: #111; padding: 20px 32px; text-align: center;">
                        <p style="color: #666; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} NexMart. Premium Tech Marketplace.</p>
                    </div>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);

        // Log Ethereal preview URL if available
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`📧 Login notification email preview: ${previewUrl}`);
        }
    }

    static async sendOrderReceipt(email: string, name: string, orderDetails: any) {
        const transporter = await this.getTransporter();
        const fromAddress = process.env.EMAIL_USER && !process.env.EMAIL_USER.includes('your_email')
            ? process.env.EMAIL_USER
            : 'noreply@nexmart.com';

        const mailOptions = {
            from: `"NexMart" <${fromAddress}>`,
            to: email,
            subject: `📦 Order Confirmation #${orderDetails.id} — NexMart`,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; border-radius: 16px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #065f46 0%, #059669 100%); padding: 40px 32px; text-align: center;">
                        <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                            <span style="font-size: 32px;">✓</span>
                        </div>
                        <h1 style="color: #ffffff; font-size: 24px; margin: 0;">Order Confirmed!</h1>
                    </div>
                    <div style="padding: 32px;">
                        <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6;">Dear <strong style="color: #fff;">${name}</strong>,</p>
                        <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6;">Thank you for your order! Here are the details:</p>
                        <div style="background: #111; border: 1px solid #333; padding: 20px; margin: 20px 0; border-radius: 12px;">
                            <h3 style="color: #fff; margin: 0 0 12px;">Order #${orderDetails.id}</h3>
                            <p style="color: #e0e0e0; margin: 4px 0;"><strong>Total:</strong> ₹${orderDetails.total}</p>
                            <p style="color: #e0e0e0; margin: 4px 0;"><strong>Status:</strong> <span style="color: #4ade80;">${orderDetails.status}</span></p>
                            <p style="color: #999; margin: 4px 0;"><strong>Date:</strong> ${new Date(orderDetails.created_at).toLocaleDateString()}</p>
                        </div>
                        <p style="color: #999; font-size: 14px;">You can track your order in your account dashboard.</p>
                        <div style="text-align: center; margin-top: 24px;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders.html" style="background: linear-gradient(135deg, #DB1A1A, #ff4444); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block;">View Order</a>
                        </div>
                    </div>
                    <div style="background: #111; padding: 20px 32px; text-align: center;">
                        <p style="color: #666; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} NexMart. Premium Tech Marketplace.</p>
                    </div>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);

        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`📧 Order receipt email preview: ${previewUrl}`);
        }
    }

    static async sendVendorPolicyEmail(email: string, name: string) {
        const transporter = await this.getTransporter();
        const fromAddress = process.env.EMAIL_USER && !process.env.EMAIL_USER.includes('your_email')
            ? process.env.EMAIL_USER
            : 'noreply@nexmart.com';

        const mailOptions = {
            from: `"NexMart Vendor Relations" <${fromAddress}>`,
            to: email,
            subject: '📋 Important: NexMart Vendor Policies & Guidelines',
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; border-radius: 16px; overflow: hidden; border: 1px solid #333;">
                    <div style="background: linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%); padding: 40px 32px; text-align: center;">
                        <h1 style="color: #ffffff; font-size: 24px; margin: 0;">Vendor Policy & Compliance</h1>
                    </div>
                    <div style="padding: 32px;">
                        <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6;">Dear <strong style="color: #fff;">${name}</strong>,</p>
                        <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6;">As a valued vendor on NexMart, please ensure you adhere to our platform guidelines. Compliance ensures a safe and premium experience for our customers.</p>
                        
                        <div style="background: #111; border-left: 4px solid #7C3AED; padding: 20px; margin: 24px 0; border-radius: 4px;">
                            <h3 style="color: #fff; margin: 0 0 12px; font-size: 16px;">Key Guidelines You Must Obey:</h3>
                            <ul style="color: #aaa; font-size: 14px; padding-left: 20px; line-height: 1.7; margin: 0;">
                                <li><strong style="color: #e0e0e0;">Authenticity:</strong> All tech products listed must be 100% genuine. Counterfeits will result in an immediate ban.</li>
                                <li><strong style="color: #e0e0e0;">Fulfillment:</strong> Orders must be shipped within 48 hours of payment confirmation.</li>
                                <li><strong style="color: #e0e0e0;">Support:</strong> Respond to customer inquiries and disputes within 24 hours.</li>
                                <li><strong style="color: #e0e0e0;">Prohibited Items:</strong> Do not list malware, stolen hardware, or illegal digital goods.</li>
                            </ul>
                        </div>
                        
                        <p style="color: #999; font-size: 14px; line-height: 1.6;">Failure to follow these rules may result in temporary suspension or permanent removal of your store from NexMart.</p>
                        
                        <div style="text-align: center; margin-top: 32px;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/vendor-dashboard.html" style="background: #fff; color: #000; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">Go to Dashboard</a>
                        </div>
                    </div>
                    <div style="background: #111; padding: 20px 32px; text-align: center;">
                        <p style="color: #666; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} NexMart. Premium Tech Marketplace.</p>
                    </div>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);

        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`📧 Vendor Policy email preview: ${previewUrl}`);
        }
    }
}