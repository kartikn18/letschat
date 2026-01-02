import jwt from 'jsonwebtoken';
import dotnev from 'dotenv';
dotnev.config();
export function autherizationToken(req:any,res:any,next:any){
    try {
    const token = req.cookies.token;
    if(!token)
{
     return res.status(401).json({message:'Access Token Required'});
}
    const verify = jwt.verify(token,process.env.JWT_SECRET as any);
    req.user = verify;
    next();
}
    catch(err){
        return res.status(403).json({message:'Invalid Access Token'});
    }
};