// Employee Model
const bcrypt = require('bcrypt');
const { DataTypes } = require("sequelize");

const employeeModel = async (sequelize) => {
  const Employee = sequelize.define('Employee', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Name cannot be empty" },
        len: { args: [3, 50], msg: "Name must be between 3 and 50 characters" }
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      isLowercase: true,
      unique: { msg: `Email is already registered` },
      validate: {
        isEmail: { msg: `Emial is Invalid` }
        ,
        isLowercase: true,
        notEmpty: { msg: `Email cannot be empty` }
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Password cannot be empty" },
        len: { args: [6, 100], msg: "Password must be between 6 and 100 characters" },
        isStrongPassword(value) {
          const strongPasswordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;
          if (!strongPasswordRegex.test(value)) {
            throw new Error(
              "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
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
