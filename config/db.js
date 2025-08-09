// db.js
const Sequelize = require("sequelize");
const employeeModel = require("../src/models/employeeSchema");

const sequelize = new Sequelize('login_omnie', 'postgres', '50406315', {
  host: 'localhost',
  dialect: 'postgres'
});

let EmployeeModel = null;
const connection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    EmployeeModel = await employeeModel(sequelize)
    await sequelize.sync({ alter: true });
    console.log("Database Synced")
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

const getEmployeeModel = () => {
  if (!EmployeeModel) {
    throw new Error("EmployeeModel not initialized. Make sure to call connection() first.");
  }
  return EmployeeModel;
}
module.exports = { connection, getEmployeeModel };