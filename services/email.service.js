// services/email.service.js
import nodemailer from "nodemailer";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// Create reusable transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "ujyalokhet@gmail.com",
    pass: process.env.EMAIL_PASSWORD, // Gmail App Password (required)
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter error:", error);
  } else {
    console.log("✅ Email service ready to send emails");
  }
});

/**
 * Generate a secure random token for email verification
 */
export const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Generate a 6-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

/**
 * Send email verification email
 */
export const sendVerificationEmail = async (email, name, token) => {
  try {
    const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:4200"}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
    
    const mailOptions = {
      from: `"Ujyalo Khet" <${process.env.EMAIL_USER || "ujyalokhet@gmail.com"}>`,
      to: email,
      subject: "Verify Your Email - Ujyalo Khet",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #28a745; padding: 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🌾 Ujyalo Khet</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #333333; margin-top: 0;">Welcome to Ujyalo Khet!</h2>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                        Hi ${name || "there"},
                      </p>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                        Thank you for signing up with Ujyalo Khet! Please verify your email address to complete your registration and start shopping for fresh produce.
                      </p>
                      <p style="text-align: center; margin: 30px 0;">
                        <a href="${verificationUrl}" 
                           style="display: inline-block; background-color: #28a745; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
                          Verify Email Address
                        </a>
                      </p>
                      <p style="color: #999999; font-size: 14px; line-height: 1.6;">
                        If the button doesn't work, copy and paste this link into your browser:
                      </p>
                      <p style="color: #28a745; font-size: 12px; word-break: break-all;">
                        ${verificationUrl}
                      </p>
                      <p style="color: #999999; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                        This link will expire in 24 hours. If you didn't create an account with Ujyalo Khet, please ignore this email.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                      <p style="color: #6c757d; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} Ujyalo Khet. All rights reserved.
                      </p>
                      <p style="color: #6c757d; font-size: 12px; margin: 5px 0 0 0;">
                        This is an automated email, please do not reply.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
        Welcome to Ujyalo Khet!
        
        Hi ${name || "there"},
        
        Thank you for signing up with Ujyalo Khet! Please verify your email address to complete your registration.
        
        Click this link to verify your email:
        ${verificationUrl}
        
        This link will expire in 24 hours. If you didn't create an account with Ujyalo Khet, please ignore this email.
        
        © ${new Date().getFullYear()} Ujyalo Khet. All rights reserved.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending verification email:", error);
    throw error;
  }
};

/**
 * Send password reset email (for future use)
 */
export const sendPasswordResetEmail = async (email, name, token) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:4200"}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    
    const mailOptions = {
      from: `"Ujyalo Khet" <${process.env.EMAIL_USER || "ujyalokhet@gmail.com"}>`,
      to: email,
      subject: "Reset Your Password - Ujyalo Khet",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="background-color: #28a745; padding: 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🌾 Ujyalo Khet</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #333333; margin-top: 0;">Password Reset Request</h2>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                        Hi ${name || "there"},
                      </p>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                        You requested to reset your password. Click the button below to reset it:
                      </p>
                      <p style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="display: inline-block; background-color: #28a745; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
                          Reset Password
                        </a>
                      </p>
                      <p style="color: #999999; font-size: 14px; line-height: 1.6;">
                        If the button doesn't work, copy and paste this link into your browser:
                      </p>
                      <p style="color: #28a745; font-size: 12px; word-break: break-all;">
                        ${resetUrl}
                      </p>
                      <p style="color: #999999; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                        This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                      <p style="color: #6c757d; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} Ujyalo Khet. All rights reserved.
                      </p>
                      <p style="color: #6c757d; font-size: 12px; margin: 5px 0 0 0;">
                        This is an automated email, please do not reply.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
        Password Reset Request - Ujyalo Khet
        
        Hi ${name || "there"},
        
        You requested to reset your password. Click the link below to reset it:
        
        ${resetUrl}
        
        This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
        
        © ${new Date().getFullYear()} Ujyalo Khet. All rights reserved.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending password reset email:", error);
    throw error;
  }
};

/**
 * Send OTP email for password reset
 */
export const sendPasswordResetOTPEmail = async (email, name, otp) => {
  try {
    const mailOptions = {
      from: `"Ujyalo Khet" <${process.env.EMAIL_USER || "ujyalokhet@gmail.com"}>`,
      to: email,
      subject: "Password Reset OTP - Ujyalo Khet",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset OTP</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #dc3545; padding: 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🌾 Ujyalo Khet</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #333333; margin-top: 0;">Reset Your Password</h2>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                        Hi ${name || "there"},
                      </p>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                        You requested to reset your password. Please use the OTP below to verify your identity and reset your password.
                      </p>
                      <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                        <h1 style="color: #dc3545; font-size: 48px; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                          ${otp}
                        </h1>
                      </div>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                        Enter this OTP in the password reset form to proceed with resetting your password.
                      </p>
                      <p style="color: #999999; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                        This OTP will expire in 10 minutes. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                      <p style="color: #6c757d; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} Ujyalo Khet. All rights reserved.
                      </p>
                      <p style="color: #6c757d; font-size: 12px; margin: 5px 0 0 0;">
                        This is an automated email, please do not reply.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
        Password Reset OTP - Ujyalo Khet
        
        Hi ${name || "there"},
        
        You requested to reset your password. Please use the OTP below to verify your identity.
        
        Your OTP: ${otp}
        
        Enter this OTP in the password reset form to proceed with resetting your password.
        
        This OTP will expire in 10 minutes. If you didn't request a password reset, please ignore this email.
        
        © ${new Date().getFullYear()} Ujyalo Khet. All rights reserved.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset OTP email sent to ${email}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending password reset OTP email:", error);
    throw error;
  }
};

/**
 * Send OTP email for signup verification
 * Includes both OTP (primary method) and verification link (alternative method)
 */
export const sendOTPEmail = async (email, name, otp, verificationToken = null) => {
  try {
    const verificationUrl = verificationToken 
      ? `${process.env.FRONTEND_URL || "http://localhost:4200"}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`
      : null;

    const mailOptions = {
      from: `"Ujyalo Khet" <${process.env.EMAIL_USER || "ujyalokhet@gmail.com"}>`,
      to: email,
      subject: "Your Signup OTP - Ujyalo Khet",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Signup OTP</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #28a745; padding: 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🌾 Ujyalo Khet</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #333333; margin-top: 0;">Verify Your Email</h2>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                        Hi ${name || "there"},
                      </p>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                        Thank you for signing up with Ujyalo Khet! Please verify your email address to complete your registration.
                      </p>
                      
                      <!-- Primary Method: OTP -->
                      <div style="margin: 30px 0;">
                        <h3 style="color: #333333; font-size: 18px; margin-bottom: 15px;">Option 1: Enter OTP (Recommended)</h3>
                        <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                          <h1 style="color: #28a745; font-size: 48px; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                            ${otp}
                          </h1>
                        </div>
                        <p style="color: #666666; font-size: 16px; line-height: 1.6; margin-top: 15px;">
                          Enter this OTP in the signup form to complete your registration.
                        </p>
                        <p style="color: #999999; font-size: 14px; line-height: 1.6; margin-top: 10px;">
                          This OTP will expire in 10 minutes.
                        </p>
                      </div>

                      ${verificationUrl ? `
                      <!-- Alternative Method: Verification Link -->
                      <div style="margin: 30px 0; padding-top: 30px; border-top: 2px solid #e9ecef;">
                        <h3 style="color: #333333; font-size: 18px; margin-bottom: 15px;">Option 2: Click Verification Link</h3>
                        <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                          Alternatively, you can click the button below to verify your email:
                        </p>
                        <p style="text-align: center; margin: 20px 0;">
                          <a href="${verificationUrl}" 
                             style="display: inline-block; background-color: #28a745; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
                            Verify Email Address
                          </a>
                        </p>
                        <p style="color: #999999; font-size: 14px; line-height: 1.6;">
                          If the button doesn't work, copy and paste this link into your browser:
                        </p>
                        <p style="color: #28a745; font-size: 12px; word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">
                          ${verificationUrl}
                        </p>
                        <p style="color: #999999; font-size: 14px; line-height: 1.6; margin-top: 10px;">
                          This link will expire in 24 hours.
                        </p>
                      </div>
                      ` : ''}
                      
                      <p style="color: #999999; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                        If you didn't create an account with Ujyalo Khet, please ignore this email.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                      <p style="color: #6c757d; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} Ujyalo Khet. All rights reserved.
                      </p>
                      <p style="color: #6c757d; font-size: 12px; margin: 5px 0 0 0;">
                        This is an automated email, please do not reply.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
        Verify Your Email - Ujyalo Khet
        
        Hi ${name || "there"},
        
        Thank you for signing up with Ujyalo Khet! Please verify your email address to complete your registration.
        
        Option 1: Enter OTP (Recommended)
        Your OTP: ${otp}
        Enter this OTP in the signup form to complete your registration.
        This OTP will expire in 10 minutes.
        
        ${verificationUrl ? `
        Option 2: Click Verification Link
        Alternatively, you can click this link to verify your email:
        ${verificationUrl}
        This link will expire in 24 hours.
        ` : ''}
        
        If you didn't create an account with Ujyalo Khet, please ignore this email.
        
        © ${new Date().getFullYear()} Ujyalo Khet. All rights reserved.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending OTP email:", error);
    throw error;
  }
};

