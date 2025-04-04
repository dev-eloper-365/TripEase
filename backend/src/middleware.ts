import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken"

export function Middleware(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization;
    if(!token) {
        return res.status(401).json({
            message: "token not provided"
        });
    }
    try {
        const decoded = jwt.verify(token, 'Tripease-secret');
        req.headers['email'] = decoded as unknown as string;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "invalid token"
        });
    }
}