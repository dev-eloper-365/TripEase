"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Middleware = Middleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function Middleware(req, res, next) {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({
            message: "token not provided"
        });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, 'Tripease-secret');
        req.headers['email'] = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({
            message: "invalid token"
        });
    }
}
