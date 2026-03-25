const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `Golf Charity Platform <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
      text: text || subject,
    });
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email send error:', error.message);
    return false;
  }
};

const emailTemplates = {
  welcome: (name) => ({
    subject: 'Welcome to Golf Charity Platform! 🏌️',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a2e;">Welcome, ${name}! 🎉</h1>
        <p>Your account has been created. Subscribe to start entering monthly draws and supporting charity.</p>
        <a href="${process.env.FRONTEND_URL}/subscribe" style="background:#22c55e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">Get Started</a>
      </div>
    `
  }),
  drawResults: (name, drawData) => ({
    subject: `Monthly Draw Results - ${drawData.month}/${drawData.year}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a2e;">Draw Results Are In! 🎯</h1>
        <p>Hi ${name},</p>
        <p>The winning numbers for this month are: <strong>${drawData.numbers.join(', ')}</strong></p>
        <a href="${process.env.FRONTEND_URL}/draws" style="background:#22c55e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">View Results</a>
      </div>
    `
  }),
  winner: (name, prize, matchType) => ({
    subject: `🏆 Congratulations! You won £${prize}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f59e0b;">You're a Winner! 🏆</h1>
        <p>Hi ${name},</p>
        <p>You matched <strong>${matchType}</strong> and won <strong>£${prize}</strong>!</p>
        <p>Please log in to upload your score proof to claim your prize.</p>
        <a href="${process.env.FRONTEND_URL}/dashboard" style="background:#22c55e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">Claim Prize</a>
      </div>
    `
  }),
  subscriptionConfirm: (name, plan, amount, endDate) => ({
    subject: 'Subscription Confirmed ✅',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a2e;">Subscription Active!</h1>
        <p>Hi ${name}, your <strong>${plan}</strong> subscription is now active.</p>
        <p>Amount: £${amount} | Renews: ${endDate}</p>
        <a href="${process.env.FRONTEND_URL}/dashboard" style="background:#22c55e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">Go to Dashboard</a>
      </div>
    `
  }),
};

module.exports = { sendEmail, emailTemplates };