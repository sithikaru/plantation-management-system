const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      const user = await User.findById(decoded.userId);
      
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. User not found or inactive.'
        });
      }

      // Add user info to request object
      req.user = {
        userId: user._id,
        email: user.email,
        role: user.role,
        name: user.name
      };

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error in authentication'
    });
  }
};

// Authorize roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized to access this resource.`
      });
    }

    next();
  };
};

// Check if user is manager
const isManager = authorize('manager');

// Check if user is manager or analyst
const isManagerOrAnalyst = authorize('manager', 'analyst');

// Check if user is field worker or higher
const isFieldWorkerOrHigher = authorize('manager', 'analyst', 'field');

module.exports = {
  protect,
  authorize,
  isManager,
  isManagerOrAnalyst,
  isFieldWorkerOrHigher
};
