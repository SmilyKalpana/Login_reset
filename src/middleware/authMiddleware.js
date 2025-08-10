const jwt = require('jsonwebtoken');
const { getEmployeeModel } = require('../../config/db');


const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Token format: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access token missing' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Optionally attach user info to request
    const Employee = getEmployeeModel();
    const employee = await Employee.findByPk(decoded.id);

    if (!employee) {
      return res.status(401).json({ message: 'Invalid token: user not found' });
    }

    req.employee = employee; // attach employee info to req for use in next middleware/routes
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

module.exports = { authenticateToken };
