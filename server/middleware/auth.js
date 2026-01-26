import { getUserByAuthToken, getUser } from '../db/database.js';
import config from '../config.js';

/**
 * Authentication middleware
 * Validates Bearer token in Authorization header
 * Sets req.user and req.userId if valid
 */
export const authenticate = async (req, res, next) => {
  // Skip auth if disabled in config
  if (!config.authEnabled) {
    // Still try to get user from request body/params for convenience
    const userId = req.body?.userId || req.params?.id || req.params?.userId;
    if (userId) {
      req.userId = userId;
      const user = await getUser(userId);
      if (user) req.user = user;
    }
    return next();
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    const user = await getUserByAuthToken(token);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ 
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Optional authentication middleware
 * Tries to authenticate but doesn't fail if no token provided
 */
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7);
  
  try {
    const user = await getUserByAuthToken(token);
    if (user) {
      req.user = user;
      req.userId = user.id;
    }
  } catch (error) {
    // Ignore auth errors for optional auth
    console.warn('Optional auth failed:', error.message);
  }
  
  next();
};

/**
 * Verify user owns the resource being accessed
 * Must be used after authenticate middleware
 */
export const authorizeUser = (paramName = 'id') => {
  return (req, res, next) => {
    // Skip if auth is disabled
    if (!config.authEnabled) {
      return next();
    }

    const requestedUserId = req.params[paramName] || req.body?.userId;
    
    if (!req.userId) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (requestedUserId && requestedUserId !== req.userId) {
      return res.status(403).json({ 
        error: 'Access denied',
        code: 'FORBIDDEN'
      });
    }

    next();
  };
};

export default { authenticate, optionalAuth, authorizeUser };
