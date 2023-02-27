const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
/* const moment = require('moment'); */
require('dotenv').config()

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Crea un nuevo cliente de OAuth2 con tus credenciales
const client = new OAuth2Client(
  process.env.OAUTH2_CLIENT_ID,
  process.env.OAUTH2_CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Genera un enlace de autorización de OAuth2
function generateAuthUrl() {
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
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
  const { data } = await sheets.spreadsheets.get({
    auth: client,
    spreadsheetId: process.env.YOUR_SPREADSHEET_ID,
  });
  return data;
}

// Maneja la solicitud de autenticación
async function handleAuth(req, res) {
  const authUrl = generateAuthUrl();
  res.redirect(authUrl);
}

// Maneja el intercambio de código de autorización por un token de acceso
async function handleCallback(req, res) {
  const { code } = req.query;
  const tokens = await getAccessToken(code);
  client.setCredentials(tokens);
  const spreadsheets = await getSpreadsheets(tokens.access_token);
  res.send(spreadsheets);
}
  


const express = require('express');
const app = express();

app.get('/', handleAuth);
app.get('/auth/google/callback', handleCallback);

app.listen(3000, () => console.log('App listening on port 3000!'));






