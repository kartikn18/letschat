import jwt from 'jsonwebtoken';
import dotnev from 'dotenv';
dotnev.config();
export function authenticateToken(req:any,res:any,next:any){
    try {
    const token = req.headers.authorization?.split(' ')[1];
    if(!token)
{
     return res.status(401).json({message:'Access Token Required'});
}
    const verify = jwt.verify(token,process.env.JWT_SECRET as string);
    req.user = verify;
    next();
}
    catch(err){
        return res.status(403).json({message:'Invalid Access Token'});
    }

};