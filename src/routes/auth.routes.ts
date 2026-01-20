import { Router } from 'express';
import { checkUserExists, CreateUser, LoginUser, generateandSaveOTP, sendOTPEmail, verifyOTP, hashPassword } from '../utils/auth.utils.js';
import { db } from '../config/db.js';
import { otpRequestLimit } from '../middlewares/otprequest.rl.js';
import { forgetpasswordLimit } from '../middlewares/forgetpass.rl.js';
import { otpverificationLimit } from '../middlewares/otpverification.rl.js';

const router = Router();

// Register route
router.post('/register', async (req, res) => {
    try {
        const { email, password,username } = req.body;
        
        // Validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Email,username, password are required' });
        }
        
        // Check if user exists
        const existingUser = await checkUserExists(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already registered' });
        }
        
        // Create user
        const token = await CreateUser(email, password,username);
        
        // Set cookie with secure flags
        res.cookie('cookie', token, {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000
        });
        
        return res.status(201).json({ 
            token, 
            message: 'Registration successful',
            redirect: '/join'
        });
    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        
        const existingUser = await checkUserExists(email);
        if (!existingUser) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        const token = await LoginUser(email, password);
        
        if (!token) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        res.cookie('cookie', token, {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000
        });
        
        return res.status(200).json({ 
            token, 
            message: 'Login successful',
            redirect: '/join'
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// Forget Password - Request OTP
// Forget Password - Request OTP
router.post('/forgetPassword', otpRequestLimit, async (req: any, res: any) => {
    const { email } = req.body;
    
    console.log('=== FORGOT PASSWORD REQUEST ===');
    console.log('Email:', email);
    
    try {
        // Validation
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        
        const user = await checkUserExists(email);
        console.log('User exists:', !!user);
        
        // For security: Always return success, don't reveal if email exists
        if (!user) {
            console.log('User not found, returning success message anyway');
            return res.status(200).json({ 
                message: 'If the email exists, an OTP has been sent',
                redirect: '/verify-otp'
            });
        }
        
        // Generate and save OTP
        console.log('Generating OTP...');
        const otp = await generateandSaveOTP(email);
        console.log('OTP generated and saved');
        
        // Send OTP via email
        console.log('Sending email...');
        await sendOTPEmail(email, otp);
        console.log('Email sent successfully!');
        console.log('==============================');
        
        return res.status(200).json({ 
            message: 'OTP sent to email',
            redirect: '/verify-otp'
        });
    } catch (error) {
        console.error('Forget password error:', error);
        
        // Return more specific error in development
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        
        return res.status(500).json({ 
            message: process.env.NODE_ENV === 'development' 
                ? `Error: ${errorMessage}` 
                : 'Failed to send OTP. Please try again.',
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
});

// Verify OTP and Update Password
router.post('/verifyOTP', otpverificationLimit, async (req: any, res: any) => {
    const { email, otp, newPassword } = req.body;
    
    try {
        // Validation
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'Email, OTP, and new password are required' });
        }
        
        // Verify OTP
        const isValidOTP = await verifyOTP(email, otp);
        if (!isValidOTP) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }
        
        // Hash new password
        const hashed = await hashPassword(newPassword);
        
        // Update password in database
        await db
            .updateTable('users')
            .set({ password: hashed } as any)
            .where('email', '=', email)
            .execute();
        
        return res.status(200).json({ 
            message: 'Password updated successfully',
            redirect: '/login'
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// Logout route
router.post('/logout', (req, res) => {
    res.clearCookie('cookie', {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production'
    });
    return res.status(200).json({ 
        message: 'Logged out successfully',
        redirect: '/login'
    });
});

// Get current user info
router.get('/me', (req, res) => {
    const token = req.cookies.cookie;
    
    if (!token) {
        return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
        const { verifyJWT } = require('../utils/auth.utils.js');
        const decoded = verifyJWT(token);
        return res.json({ user: decoded });
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
});

export default router;