// Employee Controller
const bcrypt = require('bcrypt');
const { getEmployeeModel } = require('../../config/db');
const crypto = require('crypto');
const { sendMail } = require('../utils/mailer');
const jwt = require('jsonwebtoken');



const JWT_SECRET = "1234567890";
// Get Employees
const getAllEmployees = async (req, res) => {
  try {
    const Employee = getEmployeeModel(); // get the initialized model
    const employees = await Employee.findAll()// call the method
    if (employees.length == 0) {
      return res.status(200).json("Users not found")
    }
    res.status(200).json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error); // log for debugging
    res.status(500).send("Server error"); // 500 for server issues
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

    // Create new employee (password hashing handled by model hooks)
    const newEmployee = await Employee.create({ name, email, password });

    res.status(201).json({ message: 'Employee registered successfully', employee: { id: newEmployee.id, name: newEmployee.name, email: newEmployee.email } });
  } catch (error) {
    console.error('Error registering employee:', error);
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

    // Create JWT payload (you can add other claims if needed)
    const payload = {
      id: employee.id,
      email: employee.email,
      name: employee.name
    };

    // Sign token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

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
// const loginEmployee = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({ message: 'Email and password are required' });
//     }

//     const Employee = getEmployeeModel();

//     const employee = await Employee.findOne({ where: { email } });
//     if (!employee) {
//       return res.status(401).json({ message: 'Invalid email or password' });
//     }

//     const validPassword = await employee.isValidPassword(password);
//     if (!validPassword) {
//       return res.status(401).json({ message: 'Invalid email or password' });
//     }

//     // Successful login — you can also create JWT token here if needed
//     res.status(200).json({
//       message: 'Login successful',
//       employee: { id: employee.id, name: employee.name, email: employee.email }
//     });
//   } catch (error) {
//     console.error('Error logging in employee:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

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

    // Update fields if provided
    if (name) employee.name = name;
    if (password) employee.password = password;  // Will be hashed by beforeUpdate hook

    await employee.save();

    res.status(200).json({ message: 'Employee updated successfully', employee: { id: employee.id, name: employee.name, email: employee.email } });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const Employee = getEmployeeModel();

    const employee = await Employee.findByPk(id);

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

    // Generate reset token
    const token = crypto.randomBytes(20).toString('hex');

    // Set token and expiry (e.g., 1 hour)
    employee.resetPasswordToken = token;
    employee.resetPasswordExpires = Date.now() + 3600000;
    await employee.save();

    // Construct reset URL — adjust URL to your frontend reset page
    const resetUrl = `http://localhost:3000/reset-password?token=${token}`;

    // Send email
    const html = `
      <p>You requested a password reset</p>
      <p>Click this <a href="${resetUrl}">link</a> to reset your password. This link expires in 1 hour.</p>
    `;
    await sendMail(employee.email, "Password Reset", html);

    res.status(200).json({ message: "Password reset email sent" });
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
        resetPasswordExpires: { [Sequelize.Op.gt]: Date.now() },  // token not expired
      }
    });

    if (!employee) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Update password — password hashing is handled by model hooks
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

// Export controllers
module.exports = { resetPassword, forgotPassword, registerEmployee, loginEmployee, updateEmployee, logoutEmployee, getEmployeeById, getAllEmployees };
