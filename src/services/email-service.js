const nodemailer = require('nodemailer');

class EmailService {
  static transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  // =============================
  // Verification Email
  // =============================
  static async sendVerificationEmail(user, token) {
    try {

      const mailOptions = {
        from: {
          name: 'PharmaNear Limited',
          address: process.env.GMAIL_USER || 'noreply@producttrace.com',
        },
        to: user.email,
        subject: 'Verify Your Email Address',
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #d97706 0%, #d97706 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">PharmaNear Limited</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <h2 style="color: #333;">Welcome, ${user.name}!</h2>
              <p style="color: #666; line-height: 1.6;">
                Thank you for registering with PharmaNear. To complete your registration and activate your account, please copy the verification token below and paste it when requested in your onboarding screen.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #333; font-size: 14px; font-weight: bold; margin-bottom: 10px;">Your Verification Token:</p>
                <div style="background: #ffffff; border: 2px dashed #d97706; padding: 20px; border-radius: 8px; margin: 0 auto; max-width: 400px;">
                  <code style="font-size: 24px; font-weight: bold; color: #d97706; letter-spacing: 2px; word-break: break-all; display: block; font-family: 'Courier New', monospace;">${token}</code>
                </div>
                <p style="color: #666; font-size: 12px; margin-top: 10px; font-style: italic;">Click the token to select and copy it</p>
              </div>

              <div style="background: #fff3cd; border-left: 4px solid #d97706; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="color: #856404; margin: 0; font-size: 14px;">
                  <strong>📋 How to use:</strong><br/>
                  1. Copy the token above<br/>
                  2. Return to your onboarding screen<br/>
                  3. Paste the token in the verification field
                </p>
              </div>

              <p style="color: #999; font-size: 14px; text-align: center;">
                ⏰ This verification token will expire in <strong>24 hours</strong> for security reasons.
              </p>
            </div>
            <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 14px;">
              <p style="margin: 0;">© 2025 PharmaNear Limited. All rights reserved.</p>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return false;
    }
  }

  // =============================
  // Password Reset Email
  // =============================
  static async sendPasswordResetEmail(email, username, token) {
    try {
      const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password?token=${token}`;

      const mailOptions = {
        from: {
          name: 'PharmaNear Limited',
          address: process.env.GMAIL_USER || 'noreply@producttrace.com',
        },
        to: email,
        subject: 'Reset Your Password',
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #d97706 0%, #d97706 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">PharmaNear Limited</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <h2 style="color: #333;">Password Reset Request</h2>
              <p style="color: #666; line-height: 1.6;">
                Hello ${username}, we received a request to reset your password. If you made this request, click the button below to reset your password.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Reset Password
                </a>
              </div>
              <p style="color: #999; font-size: 14px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #e74c3c;">${resetUrl}</a>
              </p>
              <p style="color: #999; font-size: 14px;">
                This reset link will expire in 1 hour for security reasons. If you didn't request this password reset, please ignore this email.
              </p>
            </div>
            <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 14px;">
              <p>© 2024 PharmaNear Limited. All rights reserved.</p>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }

  // =============================
  // Company Approval Email
  // =============================
  static async sendCompanyApprovalEmail(email, companyName) {
    try {
      const mailOptions = {
        from: {
          name: 'PharmaNear Limited',
          address: process.env.GMAIL_USER || 'noreply@producttrace.com',
        },
        to: email,
        subject: 'Your Company Has Been Approved',
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">PharmaNear Limited</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <h2 style="color: #333;">Congratulations!</h2>
              <p style="color: #666; line-height: 1.6;">
                We are pleased to inform you that your company <strong>${companyName}</strong> has been successfully approved.
              </p>
              <p style="color: #666; line-height: 1.6;">
                You can now access all platform features and manage your company profile.
              </p>
            </div>
            <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 14px;">
              <p>© 2024 PharmaNear Limited. All rights reserved.</p>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Failed to send company approval email:', error);
      return false;
    }
  }

  // =============================
  // Company Document Rejection Email
  // =============================
  static async sendCompanyDocumentRejectionEmail(email, companyName, documentName, reason) {
    try {
      const mailOptions = {
        from: {
          name: 'PharmaNear Limited',
          address: process.env.GMAIL_USER || 'noreply@producttrace.com',
        },
        to: email,
        subject: `Document Rejection Notice - ${companyName}`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">PharmaNear Limited</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <h2 style="color: #333;">Document Rejected</h2>
              <p style="color: #666; line-height: 1.6;">
                We regret to inform you that your submitted document <strong>${documentName}</strong> for company <strong>${companyName}</strong> has been rejected.
              </p>
              <p style="color: #666; line-height: 1.6;">
                Reason for rejection: <em>${reason}</em>
              </p>
              <p style="color: #666; line-height: 1.6;">
                Please update the document and resubmit it for review.
              </p>
            </div>
            <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 14px;">
              <p>© 2024 PharmaNear Limited. All rights reserved.</p>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Failed to send company document rejection email:', error);
      return false;
    }
  }
}

module.exports = { EmailService };
