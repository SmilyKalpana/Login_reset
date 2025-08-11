// Employee Routes
const express = require('express');
const { registerEmployee, loginEmployee, updateEmployee, logoutEmployee, getEmployeeById, forgotPassword, resetPassword, getAllEmployees } = require('../controllers/employeeController');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');


router.post('/register', registerEmployee);
router.post('/login', loginEmployee);
router.put('/update/:id', authenticateToken, updateEmployee);
router.post('/logout', logoutEmployee);
router.get('/employees', getAllEmployees);
router.get('/employee/:id', authenticateToken, getEmployeeById);
router.get('/employees', getAllEmployees);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
