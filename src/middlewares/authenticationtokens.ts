import type  { Request } from 'express';
import type { Response } from 'express';
import type { NextFunction } from 'express';
import  {verifyJWT}  from '../utils/auth.utils.js';
import type{ JWTPayload } from '../utils/auth.utils.js';


declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}


 //Middleware to authenticate JWT tokens from cookies or headers
 
export function authenticate(req: Request, res: Response, next: NextFunction) {
    try {
        // Get token from cookie or Authorization header
        let token = req.cookies.cookie;
        
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }
        
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        
        // Verify token
        const decoded = verifyJWT(token);
        
        // Attach user data to request
        req.user = decoded;
        
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({ 
            message: error instanceof Error ? error.message : 'Invalid or expired token'
        });
    }
}
export function redirectIfAuthenticated(req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.cookies.cookie;
        
        if (token) {
            verifyJWT(token);
            // User is authenticated, redirect to dashboard
            return res.redirect('/dashboard');
        }
        
        next();
    } catch (error) {
        // Token invalid, continue to login/register
        next();
    }
}