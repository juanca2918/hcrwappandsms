//Dependencias
const { google } = require('googleapis')
const twilio = require('twilio');
const moment = require('moment');
const express = require('express');
const app = express();
require('dotenv').config()

//Variables de entorno
const clientIdent = process.env.CLIENTID
const clientSecrets = process.env.CLIENTSECRET
const UriAuth = process.env.AUTHURI
const tokenUri = process.env.TOKENURI
const twilioAccount = process.env.YOUR_TWILIO_ACCOUNT_SID
const twilioAuth = process.env.YOUR_TWILIO_AUTH_TOKEN
const spreadsheetId = process.env.YOUR_SPREADSHEET_ID
const twilioPhoneNum = process.env.YOUR_TWILIO_PHONE_NUMBER

//Funcion principal
async function sendSmsFromSheet(req, res) {
  // Autenticate usando GoogleAPIS OAuth2
  const Authenticate = new google.auth.OAuth2({
    client_id: clientIdent,
    client_secret: clientSecrets,
    auth_uri: UriAuth,
    token_uri: tokenUri
  });

  // ... Usa el objeto traido de googleapis con los datos de la constante Authenticate para logear en google
  const sheets = google.sheets({ version: 'v4', auth: Authenticate });

  // Lee datos de google sheet
  const sheet = await sheets.spreadsheets.values.get({
    spreadsheetId: `${spreadsheetId}`,
    range: 'Sheet1!A1:E1',
  });
  const rows = sheet.data.values;

  // Inicializa el cliente de twilio
  const client = twilio(
    `${twilioAccount}`,
    `${twilioAuth}`
  );

  //Para saber que momento del dia es y asi saludar a los usuarios depende de la hora del dia
  let hour = moment().format('HH');
  let saludo = ''
  if (hour >= 6 && hour < 12) {
    saludo = 'Buenos días!';
  } else if (hour >= 12 && hour < 19) {
    saludo = 'Buenas tardes!';
  } else {
    saludo = 'Buenas noches!';
  }

  // Loop sobre la fila o row que trae el objeto sheet con toda su informacion
  for (const row of rows) {
    const [, , date, name, phoneNumber] = row;
    const appointmentDatetime = moment(date, 'MM/DD/YYYY HH:mm');
    const oneDayBefore = moment(appointmentDatetime).subtract(1, 'day');
    const thirtyMinutesBefore = moment(appointmentDatetime).subtract(30, 'minutes');
    const currentDate = moment();
    let messageOneDay = `Buenas ${saludo}, Señor(a) ${name}, le recordamos que tiene cita en la fecha ${appointmentDatetime}`
    let messagethirtymin = `Buenas ${saludo}, Señor(a) ${name}, le recordamos que tiene cita en 30 min`
    logger.info(`Starting the SMS sending job at ${moment().format('YYYY-MM-DD HH:mm:ss')}`);

    // Check Si la fecha actual es estrictamente igual que un dia antes
    if (currentDate === oneDayBefore) {
      // Send an SMS message with Twilio
      await client.messages.create({
        to: phoneNumber,
        from: twilioPhoneNum,
        body: messageOneDay,
      });
      logger.info(`Sending SMS to ${phoneNumber} with message "${messageOneDay}"`);
    }

    // Check Si la fecha actual es estrictamente igual a 30 minutos antes
    if (currentDate === thirtyMinutesBefore) {
      // Send an SMS message with Twilio
      await client.messages.create({
        to: phoneNumber,
        from: twilioPhoneNum,
        body: messagethirtymin,
      });
      logger.info(`Sending SMS to ${phoneNumber} with message "${messagethirtymin}"`);
    }
  }

  res.send('Mensajes SMS enviados');
  
}

// Programa el envio de los mensajes de texto por cron
exports.handler = async function (event, context) {
  const job = new cron.CronJob('0 0 * * *', sendSmsFromSheet, null, true, 'America/Bogota');
  job.start();
  return { statusCode: 200, body: 'SMS sending job started' }
}

app.get('/', sendSmsFromSheet);
app.get('/politicasprivacidad', function(req, res) {
  res.send('hello world');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
