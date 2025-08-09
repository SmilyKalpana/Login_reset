const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: "smtp.example.com",  // your SMTP server, e.g. smtp.gmail.com
  port: 587,
  secure: false,             // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,  // your email
    pass: process.env.EMAIL_PASS,  // your email password or app password
  },
});

const sendMail = async (to, subject, html) => {
  const mailOptions = {
    from: `"Your App" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendMail };
