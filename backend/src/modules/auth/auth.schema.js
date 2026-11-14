import { z } from 'zod';

export const registerSchema = {
  body: z.object({
    businessName: z.string().min(2, 'Business name must be at least 2 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Valid email address required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    timezone: z.string().optional().default('UTC')
  })
};

export const loginSchema = {
  body: z.object({
    email: z.string().email('Valid email address required'),
    password: z.string().min(1, 'Password is required')
  })
};

export const forgotPasswordSchema = {
  body: z.object({
    email: z.string().email('Valid email address required')
  })
};

export const verifyOtpSchema = {
  body: z.object({
    email: z.string().email('Valid email address required'),
    otp: z.string().min(4, 'OTP must be at least 4 digits').max(10, 'Invalid OTP format')
  })
};

export const resetPasswordWithOtpSchema = {
  body: z.object({
    email: z.string().email('Valid email address required'),
    resetToken: z.string().min(10, 'Valid reset token required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters')
  })
};

export default {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordWithOtpSchema
};
