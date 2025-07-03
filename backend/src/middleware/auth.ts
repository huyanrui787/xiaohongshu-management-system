import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { createError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: User;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw createError('Access denied. No token provided.', 401);
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      throw createError('Invalid token.', 401);
    }
    
    if (!user.isActive) {
      throw createError('Account is deactivated.', 401);
    }
    
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError('Access denied.', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(createError('Insufficient permissions.', 403));
    }
    
    next();
  };
};

export const checkPermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError('Access denied.', 401));
    }
    
    const permissions = req.user.permissions as string[] || [];
    if (!permissions.includes(permission) && req.user.role !== 'admin') {
      return next(createError('Insufficient permissions.', 403));
    }
    
    next();
  };
};