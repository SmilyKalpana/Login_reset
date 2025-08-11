// Auth Middleware
const jwt = require('jsonwebtoken');
const { getEmployeeModel } = require('../../config/db');


const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access token missing' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);


    const Employee = getEmployeeModel();
    const employee = await Employee.findByPk(decoded.id);

    if (!employee) {
      return res.status(401).json({ message: 'Invalid token: user not found' });
    }

    req.employee = employee;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

module.exports = { authenticateToken };
