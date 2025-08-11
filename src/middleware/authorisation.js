const employeeAuth = (req, res, next) => {
  const requestedId = parseInt(req.params.id);
  const loggedInId = req.employee.id;

  if (loggedInId !== requestedId) {
    return res.status(403).json({ message: 'Access denied: You can only access your own data' });
  }

  next();
};


module.exports = { employeeAuth };