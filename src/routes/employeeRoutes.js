// Employee ROutes
const express = require('express');
const { registerEmployee, loginEmployee, updateEmployee, logoutEmployee, getEmployeeById, forgotPassword, resetPassword } = require('../controllers/employeeController');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');


// registering a new employee
router.post('/register', registerEmployee);

// employee login
router.post('/login', loginEmployee);
router.put('/update/:id', authenticateToken, updateEmployee);
router.post('/logout', logoutEmployee);
router.get('/employee/:id', authenticateToken, getEmployeeById);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/', resetPassword);

module.exports = router;
