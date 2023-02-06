const { google } = require('googleapis')
const twilio = require('twilio');
const moment = require('moment');
require('dotenv').config()

const key = require('./client_secret_.json');

//Funcion principal
async function sendSmsFromSheet() {
  // Authenticate using the service account key
  const auth = new google.auth.OAuth2({
    clientId: key.client_id,
    clientSecret: key.client_secret,
    redirectUri: 'http://localhost:3000/auth/google/callback'
   });
  
  const sheets = google.sheets({version: 'v4', auth:auth});
    // ... Use the sheets object to access the Google Sheets API

  // Read data from the Google Sheet
  const sheet = await sheets.spreadsheets.values.get({
    spreadsheetId: `${process.env.YOUR_SPREADSHEET_ID}`,
    range: 'Sheet1!A1:E1',
  });
  const rows = sheet.data.values;

  // Initialize the Twilio client
  const client = twilio(
    `${process.env.YOUR_TWILIO_ACCOUNT_SID}`,
    `${process.env.YOUR_TWILIO_AUTH_TOKEN}`
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
        from: process.env.YOUR_TWILIO_PHONE_NUMBER,
        body: messageOneDay,
      });
    }

    // Check if the current date is equal to or after 30 minutes before the appointment
    if (currentDate >= thirtyMinutesBefore) {
      // Send an SMS message with Twilio
      await client.messages.create({
        to: phoneNumber,
        from: process.env.YOUR_TWILIO_PHONE_NUMBER,
        body: messagethirtymin,
      });
    }
  }
}

// Call the function when the script is run
sendSmsFromSheet();    