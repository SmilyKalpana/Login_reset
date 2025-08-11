// Employee Controller
const { getEmployeeModel } = require('../../config/db');
const crypto = require('crypto');
const { sendMail } = require('../utils/mailer');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { ValidationError } = require('sequelize');


// Get Employees
const getAllEmployees = async (req, res) => {
  try {
    const Employee = getEmployeeModel();
    const employees = await Employee.findAll({
      attributes: { exclude: ['password', 'resetToken', 'resetPasswordToken', 'resetPasswordExpires', 'updatedAt',] }
    })
    if (employees.length == 0) {
      return res.status(404).json("Users not found")
    }
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).send("Server error");
  }
};


const registerEmployee = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const Employee = getEmployeeModel();

    // Check if email already exists
    const existingEmployee = await Employee.findOne({ where: { email } });
    if (existingEmployee) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    //  new employee
    const newEmployee = await Employee.create({ name, email, password });

    res.status(201).json({ message: 'Employee registered successfully', employee: { id: newEmployee.id, name: newEmployee.name, email: newEmployee.email } });
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const validationErrors = error.errors.map(err => err.message);
      return res.status(400).json({ message: 'Validation failed', errors: validationErrors });
    }
    res.status(500).json({ message: 'Server error' });
  }
};


// // Login Employee
const loginEmployee = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const Employee = getEmployeeModel();

    const employee = await Employee.findOne({ where: { email } });
    if (!employee) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const validPassword = await employee.isValidPassword(password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    //  JWT payload
    const payload = {
      id: employee.id,
      email: employee.email,
      name: employee.name
    };

    // Sign token
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      message: 'Login successful',
      token,
      employee: { id: employee.id, name: employee.name, email: employee.email }
    });
  } catch (error) {
    console.error('Error logging in employee:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update employee
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;  // employee id from URL
    const { name, password } = req.body;

    if (!name && !password) {
      return res.status(400).json({ message: 'Please provide name or password to update' });
    }

    const Employee = getEmployeeModel();

    // Find employee by ID
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Update fields
    if (name) employee.name = name;
    if (password) employee.password = password;

    await employee.save();

    res.status(200).json({
      message: 'Employee updated successfully',
      employee: { id: employee.id, name: employee.name, email: employee.email }
    });
  } catch (error) {
    console.error('Error updating employee:', error);


    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const validationErrors = error.errors.map(err => err.message);
      return res.status(400).json({ message: 'Validation failed', errors: validationErrors });
    }

    res.status(500).json({ message: 'Server error' });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const Employee = getEmployeeModel();

    const employee = await Employee.findByPk(id, { attributes: { exclude: ["password", "resetToken"] } });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.status(200).json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
const logoutEmployee = (req, res) => {
  try {

    res.status(200).json({ message: 'Logout successful. Please delete your token on client side.' });
  } catch (error) {
    console.error('Error updating employee:', error);
  }
};


const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const Employee = getEmployeeModel();
    const employee = await Employee.findOne({ where: { email } });
    if (!employee) return res.status(404).json({ message: "Email not registered" });

    //  reset token
    const token = crypto.randomBytes(20).toString('hex');

    //  token expiry ( 1 hour)
    employee.resetPasswordToken = token;
    employee.resetPasswordExpires = Date.now() + 3600000;
    await employee.save();

    //  reset URL
    const resetUrl = `http://localhost:3000/reset-password?token=${token}`;

    //  email
    const html = `
      <p>You requested a password reset</p>
      <p>Click this <a href="${resetUrl}">link</a> to reset your password. This link expires in 1 hour.</p>
    `;
    await sendMail(employee.email, "Password Reset", html);

    res.status(200).json({ message: "Password reset email sent" });
    console.log(`${token}`)
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: "Server error" });
  }
};
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: "Token and new password required" });

    const Employee = getEmployeeModel();
    const employee = await Employee.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: Date.now() },
      }
    });

    if (!employee) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }


    employee.password = password;

    // Clear reset token fields
    employee.resetPasswordToken = null;
    employee.resetPasswordExpires = null;

    await employee.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: "Server error" });
  }
};


module.exports = { getAllEmployees, resetPassword, forgotPassword, registerEmployee, loginEmployee, updateEmployee, logoutEmployee, getEmployeeById, getAllEmployees };
