import { db } from "../config/db.js";
import bcrypt from "bcrypt";
import { Resend } from "resend";
import dotenv from "dotenv";
import jwt from 'jsonwebtoken';

dotenv.config();


// Password Hashing

export async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
}


// User Management

export async function checkUserExists(email: string) {
    const existingUser = await db
        .selectFrom('auth_credentials')
        .select(['id', 'email', 'password'])
        .where('email', '=', email)
        .executeTakeFirst();
    return existingUser;
}


export async function CreateUser(email: string, password: string): Promise<string> {
  if (!email || !password) throw new Error("Email and password required");
  if (password.length < 6) throw new Error("Password too short");

  const hashedPassword = await hashPassword(password);

  const result = await db.transaction().execute(async (trx) => {
    // double protection against race condition
    const exists = await trx
      .selectFrom("auth_credentials")
      .select("id")
      .where("email", "=", email)
      .executeTakeFirst();

    if (exists) throw new Error("User already exists");

    const newUser = await trx
      .insertInto("auth_credentials")
      .values({
        email,
        password:hashedPassword,
        created_at: new Date(),
      }as any)
      .returning(["id", "email"])
      .executeTakeFirstOrThrow()

    return newUser;
  });

  return generateJWT({ id: result.id, email: result.email });
}


export async function LoginUser(email: string, password: string): Promise<string> {
    // Validate inputs
    if (!email || !password) {
        throw new Error('Email and password are required');
    }
    
    // Check if user exists
    const user = await checkUserExists(email);
    if (!user) {
        throw new Error('Invalid credentials'); // Don't reveal if email exists
    }
    
    // Verify password
    const match = await comparePassword(password, user.password);
    if (!match) {
        throw new Error('Invalid credentials'); // Same error message for security
    }
    
    // Generate and return JWT token
    return generateJWT({ id: user.id, email: user.email });
}


const otpGenerate = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};


export async function generateandSaveOTP(email: string): Promise<string> {
    if (!email) {
        throw new Error('Email is required');
    }
    
    const otp = otpGenerate();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Remove old OTPs for this email
    await db
        .deleteFrom("email_otps")
        .where("email", "=", email)
        .execute();

    // Insert new OTP
    await db
        .insertInto("email_otps")
        .values({
            email,
            otp,
            expires_at: expiresAt,
            created_at: new Date()
        } as any)
        .execute();
    
    return otp;
}


export async function verifyOTP(email: string, otp: string): Promise<boolean> {
    if (!email || !otp) {
        throw new Error('Email and OTP are required');
    }
    
    // Find OTP record
    const record = await db
        .selectFrom('email_otps')
        .selectAll()
        .where('email', '=', email)
        .where('otp', '=', otp)
        .executeTakeFirst();
    
    if (!record) {
        throw new Error('Invalid OTP');
    }
    
    // Check expiration
    if (record.expires_at < new Date()) {
        // Delete expired OTP
        await db
            .deleteFrom('email_otps')
            .where('email', '=', email)
            .execute();
        throw new Error('OTP has expired');
    }
    
    // Delete OTP after successful verification (one-time use)
    await db
        .deleteFrom('email_otps')
        .where('email', '=', email)
        .where('otp', '=', otp)
        .execute();
    
    return true;
}


const resend = new Resend(process.env.RESEND_API_KEY!);


export async function sendOTPEmail(email: string, otp: string): Promise<void> {
    if (!email || !otp) {
        throw new Error('Email and OTP are required');
    }
    
    
    if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is not configured');
    }
    
    try {
        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || "onboarding@resend.dev",
            to: email,
            subject: "Your Password Reset OTP",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #667eea;">Password Reset Request</h2>
                    <p>You requested to reset your password. Use the following OTP to complete the process:</p>
                    <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <h1 style="color: #667eea; font-size: 36px; margin: 0; letter-spacing: 8px;">${otp}</h1>
                    </div>
                    <p><strong>This OTP will expire in 5 minutes.</strong></p>
                    <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">This is an automated message, please do not reply.</p>
                </div>
            `,
        });
        
        if (error) {
            
            throw new Error(`Failed to send OTP email: ${error.message}`);
        }
        
        
    } catch (error) {
        
        throw error;
    }
}



export interface JWTPayload {
    id: number;
    email: string;
}


export function generateJWT(payload: JWTPayload): string {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }
    
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "24h", // Changed from 15m to 24h for better UX
        issuer: 'your-app-name',
        audience: 'your-app-users'
    });
}


export function verifyJWT(token: string): JWTPayload {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            issuer: 'your-app-name',
            audience: 'your-app-users'
        }) as JWTPayload;
        
        return decoded;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new Error('Token has expired');
        } else if (error instanceof jwt.JsonWebTokenError) {
            throw new Error('Invalid token');
        }
        throw new Error('Token verification failed');
    }
}


export function refreshJWT(oldToken: string): string {
    const decoded = verifyJWT(oldToken);
    return generateJWT({ id: decoded.id, email: decoded.email });
}