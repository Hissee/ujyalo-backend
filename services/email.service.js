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

/**
 * Send order status update email
 */
export const sendOrderStatusUpdateEmail = async (email, name, orderId, status, updatedBy = "system") => {
  try {
    const statusMessages = {
      pending: { title: "Order Pending", message: "Your order is pending confirmation." },
      confirmed: { title: "Order Confirmed", message: "Your order has been confirmed and is being prepared." },
      processing: { title: "Order Being Processed", message: "Your order is currently being processed." },
      shipped: { title: "Order Shipped", message: "Your order has been shipped and is on its way to you." },
      delivered: { title: "Order Delivered", message: "Your order has been delivered successfully!" },
      completed: { title: "Order Completed", message: "Your order has been completed successfully!" },
      cancelled: { title: "Order Cancelled", message: "Your order has been cancelled." }
    };

    const statusInfo = statusMessages[status] || { 
      title: "Order Status Updated", 
      message: `Your order status has been updated to: ${status}` 
    };

    const updatedByText = updatedBy === "admin" ? "an administrator" : updatedBy === "farmer" ? "the farmer" : "the system";
    const orderIdShort = orderId.toString().substring(0, 8);

    const mailOptions = {
      from: `"Ujyalo Khet" <${process.env.EMAIL_USER || "ujyalokhet@gmail.com"}>`,
      to: email,
      subject: `${statusInfo.title} - Order #${orderIdShort}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Status Update</title>
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
                      <h2 style="color: #333333; margin-top: 0;">${statusInfo.title}</h2>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                        Hi ${name || "there"},
                      </p>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                        ${statusInfo.message}
                      </p>
                      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #333333; font-size: 14px;"><strong>Order ID:</strong> ${orderIdShort}</p>
                        <p style="margin: 5px 0 0 0; color: #333333; font-size: 14px;"><strong>Status:</strong> <span style="text-transform: capitalize;">${status}</span></p>
                        <p style="margin: 5px 0 0 0; color: #666666; font-size: 12px;">Updated by ${updatedByText}</p>
                      </div>
                      ${status === 'cancelled' ? `
                      <p style="color: #dc3545; font-size: 14px; line-height: 1.6;">
                        If you have any questions or concerns about this cancellation, please contact our support team.
                      </p>
                      ` : ''}
                      ${status === 'delivered' || status === 'completed' ? `
                      <p style="color: #28a745; font-size: 14px; line-height: 1.6; font-weight: bold;">
                        Thank you for your order! We hope you enjoy your fresh produce.
                      </p>
                      ` : ''}
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin-top: 30px;">
                        You can track your order status in your account dashboard.
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
        ${statusInfo.title} - Ujyalo Khet
        
        Hi ${name || "there"},
        
        ${statusInfo.message}
        
        Order ID: ${orderIdShort}
        Status: ${status}
        Updated by ${updatedByText}
        
        You can track your order status in your account dashboard.
        
        © ${new Date().getFullYear()} Ujyalo Khet. All rights reserved.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Order status update email sent to ${email}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending order status update email:", error);
    throw error;
  }
};

/**
 * Send order placed email to consumer
 */
export const sendOrderPlacedEmailToConsumer = async (email, name, orderId, totalAmount, orderProducts, paymentMethod) => {
  try {
    const orderIdShort = orderId.toString().substring(0, 8);
    const productList = orderProducts.map(p => `${p.productName} (${p.quantity} x Rs. ${p.price})`).join('<br>');

    const mailOptions = {
      from: `"Ujyalo Khet" <${process.env.EMAIL_USER || "ujyalokhet@gmail.com"}>`,
      to: email,
      subject: `Order Placed Successfully - Order #${orderIdShort}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Placed</title>
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
                      <h2 style="color: #333333; margin-top: 0;">Order Placed Successfully!</h2>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                        Hi ${name || "there"},
                      </p>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                        Thank you for your order! We have received your order and will process it shortly.
                      </p>
                      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #333333; font-size: 14px;"><strong>Order ID:</strong> ${orderIdShort}</p>
                        <p style="margin: 5px 0 0 0; color: #333333; font-size: 14px;"><strong>Status:</strong> Pending</p>
                        <p style="margin: 5px 0 0 0; color: #333333; font-size: 14px;"><strong>Payment Method:</strong> ${paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Online Payment'}</p>
                        <p style="margin: 5px 0 0 0; color: #333333; font-size: 14px;"><strong>Total Amount:</strong> Rs. ${totalAmount.toLocaleString('en-NP')}</p>
                      </div>
                      <div style="margin: 20px 0;">
                        <h3 style="color: #333333; font-size: 16px; margin-bottom: 10px;">Order Items:</h3>
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px;">
                          ${productList}
                        </div>
                      </div>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin-top: 30px;">
                        You will receive updates about your order status via email. You can also track your order in your account dashboard.
                      </p>
                      <p style="color: #28a745; font-size: 14px; line-height: 1.6; font-weight: bold; margin-top: 20px;">
                        Thank you for choosing Ujyalo Khet for your fresh produce needs!
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
        Order Placed Successfully - Ujyalo Khet
        
        Hi ${name || "there"},
        
        Thank you for your order! We have received your order and will process it shortly.
        
        Order ID: ${orderIdShort}
        Status: Pending
        Payment Method: ${paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Online Payment'}
        Total Amount: Rs. ${totalAmount.toLocaleString('en-NP')}
        
        Order Items:
        ${orderProducts.map(p => `${p.productName} (${p.quantity} x Rs. ${p.price})`).join('\n')}
        
        You will receive updates about your order status via email. You can also track your order in your account dashboard.
        
        Thank you for choosing Ujyalo Khet for your fresh produce needs!
        
        © ${new Date().getFullYear()} Ujyalo Khet. All rights reserved.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Order placed email sent to consumer ${email}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending order placed email to consumer:", error);
    throw error;
  }
};

/**
 * Send order placed email to farmer
 */
export const sendOrderPlacedEmailToFarmer = async (email, name, orderId, orderProducts, customerName, totalAmount) => {
  try {
    const orderIdShort = orderId.toString().substring(0, 8);
    const farmerProducts = orderProducts.filter(p => p.productName).map(p => `${p.productName} (${p.quantity} x Rs. ${p.price})`).join('<br>');
    const farmerTotal = orderProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);

    const mailOptions = {
      from: `"Ujyalo Khet" <${process.env.EMAIL_USER || "ujyalokhet@gmail.com"}>`,
      to: email,
      subject: `New Order Received - Order #${orderIdShort}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Order</title>
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
                      <h2 style="color: #333333; margin-top: 0;">New Order Received!</h2>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                        Hi ${name || "there"},
                      </p>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                        You have received a new order for your products. Please review and process the order.
                      </p>
                      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #333333; font-size: 14px;"><strong>Order ID:</strong> ${orderIdShort}</p>
                        <p style="margin: 5px 0 0 0; color: #333333; font-size: 14px;"><strong>Customer:</strong> ${customerName || 'Unknown'}</p>
                        <p style="margin: 5px 0 0 0; color: #333333; font-size: 14px;"><strong>Status:</strong> Pending</p>
                        <p style="margin: 5px 0 0 0; color: #333333; font-size: 14px;"><strong>Your Products Total:</strong> Rs. ${farmerTotal.toLocaleString('en-NP')}</p>
                      </div>
                      <div style="margin: 20px 0;">
                        <h3 style="color: #333333; font-size: 16px; margin-bottom: 10px;">Your Products in this Order:</h3>
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px;">
                          ${farmerProducts || 'No products'}
                        </div>
                      </div>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin-top: 30px;">
                        Please log in to your farmer dashboard to update the order status and manage your products.
                      </p>
                      <p style="color: #28a745; font-size: 14px; line-height: 1.6; font-weight: bold; margin-top: 20px;">
                        Thank you for being part of Ujyalo Khet!
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
        New Order Received - Ujyalo Khet
        
        Hi ${name || "there"},
        
        You have received a new order for your products. Please review and process the order.
        
        Order ID: ${orderIdShort}
        Customer: ${customerName || 'Unknown'}
        Status: Pending
        Your Products Total: Rs. ${farmerTotal.toLocaleString('en-NP')}
        
        Your Products in this Order:
        ${orderProducts.filter(p => p.productName).map(p => `${p.productName} (${p.quantity} x Rs. ${p.price})`).join('\n')}
        
        Please log in to your farmer dashboard to update the order status and manage your products.
        
        Thank you for being part of Ujyalo Khet!
        
        © ${new Date().getFullYear()} Ujyalo Khet. All rights reserved.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Order placed email sent to farmer ${email}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending order placed email to farmer:", error);
    throw error;
  }
};

