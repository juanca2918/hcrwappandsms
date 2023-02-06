const { google } = require('googleapis')
const twilio = require('twilio');
const moment = require('moment');
const { createLogger, format, transports } = require('winston');
require('dotenv').config()

const logger = createLogger({
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' }),
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
});


const clientIdent = process.env.CLIENTID
const clientSecrets = process.env.CLIENTSECRET
const UriAuth = process.env.AUTHURI
const tokenUri = process.env.TOKENURI
const twilioAccount = process.env.YOUR_TWILIO_ACCOUNT_SID
const twilioAuth = process.env.YOUR_TWILIO_AUTH_TOKEN
const spreadsheetId = process.env.YOUR_SPREADSHEET_ID
const twilioPhoneNum = process.env.YOUR_TWILIO_PHONE_NUMBER

//Funcion principal
async function sendSmsFromSheet() {
  // Authenticate using the service account key
  const Authenticate = new google.auth.OAuth2({
    client_id: clientIdent,
    client_secret: clientSecrets,
    auth_uri: UriAuth,
    token_uri: tokenUri
   });
  logger.info(Authenticate)
  const sheets = google.sheets({version: 'v4', auth:Authenticate});
    // ... Use the sheets object to access the Google Sheets API
  logger.info(sheets)
  // Read data from the Google Sheet
  const sheet = await sheets.spreadsheets.values.get({
    spreadsheetId: `${spreadsheetId}`,
    range: 'Sheet1!A1:E1',
  });
  const rows = sheet.data.values;

  // Initialize the Twilio client
  const client = twilio(
    `${twilioAccount}`,
    `${twilioAuth}`
  );

  let hour = moment().format('HH');
  let saludo = ''
  if (hour >= 6 && hour < 12) {
    saludo = 'Buenos días!';
  } else if (hour >= 12 && hour < 19) {
    saludo = 'Buenas tardes!';
  } else {
    saludo = 'Buenas noches!';
  }

  // Loop over the rows in the sheet
  for (const row of rows) {
    const [, , date, name, phoneNumber] = row;
    const appointmentDatetime = moment(date, 'MM/DD/YYYY HH:mm');
    const oneDayBefore = moment(appointmentDatetime).subtract(1, 'day');
    const thirtyMinutesBefore = moment(appointmentDatetime).subtract(30, 'minutes');
    const currentDate = moment();
    let messageOneDay = `Buenas ${saludo}, Señor(a) ${name}, le recordamos que tiene cita en la fecha ${appointmentDatetime}`
    let messagethirtymin = `Buenas ${saludo}, Señor(a) ${name}, le recordamos que tiene cita en 30 min`
    logger.info(`Starting the SMS sending job at ${moment().format('YYYY-MM-DD HH:mm:ss')}`);
    // Check if the current date is equal to or after one day before the appointment
    if (currentDate >= oneDayBefore) {
      // Send an SMS message with Twilio
      await client.messages.create({
        to: phoneNumber,
        from: twilioPhoneNum,
        body: messageOneDay,
      });
      logger.info(`Sending SMS to ${phoneNumber} with message "${messageOneDay}"`);
    }

    // Check if the current date is equal to or after 30 minutes before the appointment
    if (currentDate >= thirtyMinutesBefore) {
      // Send an SMS message with Twilio
      await client.messages.create({
        to: phoneNumber,
        from: twilioPhoneNum,
        body: messagethirtymin,
      });
      logger.info(`Sending SMS to ${phoneNumber} with message "${messagethirtymin}"`);
    }
  }
}

// Schedule the SMS sending job using cron
exports.handler = async function (event, context) {
  const job = new cron.CronJob('0 0 * * *', sendSmsFromSheet, null, true, 'America/Bogota');
  job.start();
  return { statusCode: 200, body: 'SMS sending job started' }
}

logger.info(`SMS sending job finished`);
