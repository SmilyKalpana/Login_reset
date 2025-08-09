// Employee Model
const bcrypt = require('bcrypt');
const { DataTypes } = require("sequelize");

const employeeModel = async (sequelize) => {
  const Employee = sequelize.define('Employee', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      isLowercase: true,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    // Hooks for password hashing before saving
    hooks: {
      beforeCreate: async (employee) => {
        if (employee.password) {
          const salt = await bcrypt.genSalt(10);
          employee.password = await bcrypt.hash(employee.password, salt);
        }
      },
      beforeUpdate: async (employee) => {
        if (employee.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          employee.password = await bcrypt.hash(employee.password, salt);
        }
      }
    }
  });

  // check if entered password matches the hashed password
  Employee.prototype.isValidPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
  };

  return Employee;
};

module.exports = employeeModel;
