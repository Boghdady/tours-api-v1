const nodemailer = require('nodemailer');

// Path options as argument like : {email address, subject, email content and others}
const sendEmail = async options => {
  /*  1) Create a transporter (transporter is the service that will send email like gmail, sendGrid and Mailgun)
   note: Gmail is predefined service in nodemailer but mailTrap not predefined  */
  const transporter = nodemailer.createTransport({
    // service: 'Gmail',
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
    /* Activate in gmail "less secure app" option if you user email service
     note : if we use gmail we can only send 500 email per day */
  });

  // 2) Define the email options
  const mailOptions = {
    from: 'Ahmed Boghdady <a.boghdady@indexgroup.net>',
    to: options.email,
    subject: options.subject,
    text: options.message
    // html:
  };
  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;