// Employee Routes
const express = require('express');
const { registerEmployee, loginEmployee, updateEmployee, logoutEmployee, getEmployeeById, forgotPassword, resetPassword, getAllEmployees } = require('../controllers/employeeController');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { employeeAuth } = require('../middleware/authorisation');


router.post('/register', registerEmployee);
router.post('/login', loginEmployee);
router.put('/update/:id', authenticateToken, employeeAuth, updateEmployee);
router.post('/logout', authenticateToken, logoutEmployee);
router.get('/employees', getAllEmployees);
router.get('/employee/:id', authenticateToken, employeeAuth, getEmployeeById);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
