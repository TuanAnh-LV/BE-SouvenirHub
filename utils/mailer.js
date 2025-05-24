const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

exports.sendMail = ({ to, subject, html }) => {
  return transporter.sendMail({
    from: `"SouvenirHub" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
};
