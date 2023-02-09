//Dependencias
const twilio = require('twilio');
const moment = require('moment');
const express = require('express');
const app = express();
const path = require('path');
require('dotenv').config()

//Variables de entorno
const correomio = process.env.CORREO
const privateKey = process.env.APIKEY
const twilioAccount = process.env.YOUR_TWILIO_ACCOUNT_SID
const twilioAuth = process.env.YOUR_TWILIO_AUTH_TOKEN
const spreadsheetId = process.env.YOUR_SPREADSHEET_ID
const twilioPhoneNum = process.env.YOUR_TWILIO_PHONE_NUMBER


//Funcion principal
async function sendSmsFromSheet(req, res) {
  // Autenticate usando GoogleAPIS OAuth2
  const doc = new GoogleSpreadsheet(`${spreadsheetId}`);
  await doc.useServiceAccountAuth({
    client_email: `${correomio}`,
    private_key: `${privateKey}`,
  });

  // Lee datos de google sheet
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];
  const rows = await sheet.getRows();
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

  // Loop sobre la fila o row que trae el objeto sheet con toda su informacion y lo envia a twilio
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

// Rutas direccionadas
app.get('/', (req, res) => {
  // Crea la ruta absoluta al archivo HTML
  const filePath = path.join(__dirname, 'politicasprivacidad.html');

  // Establece el tipo de contenido de la respuesta como text/html
  res.set('Content-Type', 'text/html');

  // Envía el archivo HTML como respuesta a la petición
  res.sendFile(filePath);
});

// Ruta de activacion de la funcion sendSmsFromSheet
app.get('/', sendSmsFromSheet);

//El servidor esta escuchando
const port = process.env.PORT || 8989;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
