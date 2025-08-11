// Employee Model
const bcrypt = require('bcrypt');
const { DataTypes } = require("sequelize");

const employeeModel = async (sequelize) => {
  const Employee = sequelize.define('Employee', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [3, 100],
          message: `min 3 letters`
        }
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      isLowercase: true,
      require: true,
      unique: { message: `Email already exists` },
      validate: {
        isEmail: { message: `Invalid email format` }
      },
      set(value) {
        this.setDataValue('email', value.toLowerCase());
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isStrong(value) {
          const strongPassword = /(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{4,}$/;
          if (!strongPassword.test(value)) {
            throw new Error(
              'Password must contain at least one uppercase letter, one number, one special character, and be at least 8 characters long'
            );
          }
        }
      }
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
