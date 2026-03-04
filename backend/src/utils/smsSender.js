const twilio = require('twilio');
const { AppSettings } = require('../models/AppSettings.js');
const { User } = require('../models/User.js'); // Pour récupérer le numéro de téléphone de l'utilisateur

const sendSms = async (userId, message) => {
  try {
    const appSettings = await AppSettings.findOne({ userId });
    if (!appSettings || !appSettings.smsNotifications) {
      console.log(`SMS notifications are disabled for user ${userId} or settings not found.`);
      return;
    }

    const user = await User.findById(userId);
    if (!user || !user.phone) {
      console.warn(`User ${userId} not found or has no phone number for SMS notification.`);
      return;
    }

    const accountSid = appSettings.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID;
    const authToken = appSettings.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = appSettings.twilioPhoneNumber || process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.error('Twilio credentials are not configured in AppSettings or environment variables.');
      return;
    }

    const client = new twilio(accountSid, authToken);

    await client.messages.create({
      body: message,
      to: user.phone,
      from: twilioPhoneNumber,
    });

    console.log(`SMS sent to ${user.phone} for user ${userId}.`);
  } catch (error) {
    console.error(`Error sending SMS to user ${userId}:`, error.message);
  }
};

module.exports = { sendSms };