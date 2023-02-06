const { google } = require('googleapis')
const twilio = require('twilio');
const moment = require('moment');
require('dotenv').config()

const clientIdent = process.env.clientID
const client_secrets = process.env.client_secret
const redirectUri = process.env.redirect_uris
const UriAuth = process.env.javascript_origins
const twilioAccount = process.env.YOUR_TWILIO_ACCOUNT_SID
const twilioAuth = process.env.YOUR_TWILIO_AUTH_TOKEN
const spreadsheetId = process.env.YOUR_SPREADSHEET_ID
const twilioPhoneNum = process.env.YOUR_TWILIO_PHONE_NUMBER

//Funcion principal
async function sendSmsFromSheet() {
  // Authenticate using the service account key
  const Authenticate = new google.auth.OAuth2({
    clientId: clientIdent,
    client_secret: client_secrets,
    redirectUri: redirectUri,
    uriAuth: UriAuth
   });
  
  const sheets = google.sheets({version: 'v4', auth:Authenticate});
    // ... Use the sheets object to access the Google Sheets API

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
    
    // Check if the current date is equal to or after one day before the appointment
    if (currentDate >= oneDayBefore) {
      // Send an SMS message with Twilio
      await client.messages.create({
        to: phoneNumber,
        from: twilioPhoneNum,
        body: messageOneDay,
      });
    }

    // Check if the current date is equal to or after 30 minutes before the appointment
    if (currentDate >= thirtyMinutesBefore) {
      // Send an SMS message with Twilio
      await client.messages.create({
        to: phoneNumber,
        from: twilioPhoneNum,
        body: messagethirtymin,
      });
    }
  }
}

// Schedule the SMS sending job using cron
exports.handler = async function (event, context) {
  const job = new cron.CronJob('0 0 * * *', sendSmsFromSheet, null, true, 'America/Bogota');
  job.start();
  return { statusCode: 200, body: 'SMS sending job started' }
}