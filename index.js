const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const {JWT} = require('google-auth-library');
const moment = require('moment')
const generalCredentials = require('./GeneralCredentials.json')
const credentialsGoogle = require('./credentialsGoogle.json')
const twilioAccount =  generalCredentials.account_sid
const twilioAuth =  generalCredentials.auth_token
const twilio = require('twilio')(twilioAccount,twilioAuth)
require('dotenv').config()

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Crea un nuevo cliente de OAuth2 con tus credenciales
const client = new OAuth2Client(
  credentialsGoogle.web.client_id,
  credentialsGoogle.web.client_secret,
  credentialsGoogle.web.redirect_uris,
  credentialsGoogle.web.auth_uri,
);

// Genera un enlace de autorización de OAuth2
function generateAuthUrl() {
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    include_granted_scopes: true
  });
}

// Intercambia el código de autorización por un token de acceso
async function getAccessToken(code) {
  const { tokens } = await client.getToken(code);
  return tokens;
}

// Crea una instancia de la API de hojas de cálculo de Google y solicita las hojas de cálculo
async function getSpreadsheets(accessToken) {
  const sheets = google.sheets({ version: 'v4', auth: accessToken });
  const sheetData = await sheets.spreadsheets.values.get({
    range: generalCredentials.range,
    spreadsheetId: generalCredentials.your_spreadsheet_id,
  })
  const values = sheetData.data.values
  return values
}

// Maneja la solicitud de autenticación
async function handleAuth(req, res) {
  const authUrl = generateAuthUrl();
  res.redirect(authUrl);
}

// Maneja el intercambio de código de autorización por un token de acceso
async function handleCallback(req, res) {
  console.log(req.query);
  const { code } = req.query;
  const tokens = await getAccessToken(code);
  client.setCredentials(tokens);
  const spreadsheetsData = await getSpreadsheets(tokens.access_token);
  recorreSpreadSheet(spreadsheetsData)
}

async function recorreSpreadSheet(sheetDatavalues) { 
  
  const rows = sheetDatavalues

  let hour = moment().format('HH');
  let saludo = ''
  if (hour >= 6 && hour < 12) {
    saludo = 'Buenos días!';
  } else if (hour >= 12 && hour < 19) {
    saludo = 'Buenas tardes!';
  } else {
    saludo = 'Buenas noches!';
  }
  
  for (const row of rows) {
    const [, , date, name, phone] = row;
    let messageOneDay = `Buenas ${saludo}, Señor(a) ${name}, le recordamos que tiene cita en la fecha ${date}`
    let messagethirtymin = `Buenas ${saludo}, Señor(a) ${name}, le recordamos que tiene cita en 30 min`
    const appointmentDatetime = moment(date, 'DD/MM/YYYY HH:mm');
    const oneDayBefore = moment(appointmentDatetime).subtract(1, 'day');
    const thirtyMinutesBefore = moment(appointmentDatetime).subtract(30, 'minutes');
    const currentDate = moment();

    // Check Si la fecha actual es estrictamente igual que un dia antes
    if (currentDate === oneDayBefore) {
      // Send an SMS message with Twilio
      await twilio.messages.create({
        to: phone,
        from: generalCredentials.your_twilio_phonenumber,
        body: messageOneDay,
      });
    }

    // Check Si la fecha actual es estrictamente igual a 30 minutos antes
    if (currentDate === thirtyMinutesBefore) {
      // Send an SMS message with Twilio
      await twilio.messages.create({
        to: phone,
        from: generalCredentials.your_twilio_phonenumber,
        body: messagethirtymin,
      });
    }
  }
}

/* async function vistaIndex(req, res) {
  const filePath = path.join(__dirname, 'index.html');
  const htmlContent = await fs.promises.readFile(filePath, 'utf8');
  res.header('Content-Type', 'text/html');
  res.send(htmlContent);
} */

const express = require('express');
const app = express();

/* app.get('/', vistaIndex) */
app.get('/', handleAuth).setMaxListeners(15);
app.get('/auth/google/callback', handleCallback).setMaxListeners(15);

app.listen(3000, () => console.log('App listening on port 3000!'));






