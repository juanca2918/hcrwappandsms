//Dependencias
const moment = require('moment');
const express = require('express');
const app = express();
const path = require('path');
require('dotenv').config()

//Variables de entorno
const twilioAccount = process.env.YOUR_TWILIO_ACCOUNT_SID
const twilioAuth = process.env.YOUR_TWILIO_AUTH_TOKEN
const spreadsheetId = process.env.YOUR_SPREADSHEET_ID
const twilioPhoneNum = process.env.YOUR_TWILIO_PHONE_NUMBER
const range = process.env.range
const apiKey = process.env.APIKEY

//Funcion principal
async function sendSmsFromSheet(req, res) {
  //Usamos fetch para solicitar a google sheet api la hoja de calculo desde donde obtendremos los datos
  fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`)
    .then(response => response.json())
    .then(data => {
      const fechacita = data.values[0][2];
      const name = data.values[0][3];
      const celular = data.values[0][4];
      const scheduledTime = moment(fechacita, 'MM/DD/YYYY HH:mm')
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
      let messageOneDay = `Buenas ${saludo}, Señor(a) ${name}, le recordamos que tiene cita en la fecha ${appointmentDatetime}`
      let messagethirtymin = `Buenas ${saludo}, Señor(a) ${name}, le recordamos que tiene cita en 30 min`

      if (now.isSameOrBefore(scheduledTime.subtract(1, 'hour'))) {
        // Envía el mensaje de texto con Twilio
        return fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccount}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + buf.toString(twilioAccount + ':' + twilioAuth),
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: `To=${celular}&From=${twilioPhoneNum}&Body=${messageOneDay}`
        });
      }
      if (now.isSameOrBefore(scheduledTime.subtract(30, 'minutes'))) {
        // Envía el mensaje de texto con Twilio
        return fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccount}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + buf.toString(twilioAccount + ':' + twilioAuth),
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: `To=${celular}&From=${twilioPhoneNum}&Body=${messagethirtymin}`
        });
      }
    })
    .then(response => {
      if (response) {
        console.log(response.status);
      }
    })
    .catch(error => {
      console.error(error);
    });

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

app.listen(3000, () => {
  console.log('Example app listening on port 3000!');
});

// Ruta de activacion de la funcion sendSmsFromSheet
app.get('/', sendSmsFromSheet);

//El servidor esta escuchando
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
