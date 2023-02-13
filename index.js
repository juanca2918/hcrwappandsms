const twilio = require('twilio');
const moment = require('moment');
const express = require('express');
const app = express();
const { OAuth2Client } = require('google-auth-library')
const http = require('http')
const url = require('url')
const destroyer = require('destroy')
const open = require('open')
require('dotenv').config()

//Variables de entorno
const clientId = process.env.OAUTH2_CLIENT_ID
const clientSecret = process.env.OAUTH2_CLIENT_SECRET
const authUri = process.env.AUTHURI
const tokenUri = process.env.TOKENURI
const redirectUri = process.env.REDIRECT_URI
const javascriptOrigins = process.env.JAVASCRIPT_ORIGINS
const range = process.env.RANGE
const spreadsheetId = process.env.YOUR_SPREADSHEET_ID
const twilioAccount = process.env.YOUR_TWILIO_ACCOUNT_SID
const twilioAuth = process.env.YOUR_TWILIO_AUTH_TOKEN
const twilioPhoneNum = process.env.YOUR_TWILIO_PHONE_NUMBER

async function main() {
  const oAuth2Client = await getAuthenticatedClient();
  // Make a simple request to the People API using our pre-authenticated client. The `request()` method
  // takes an GaxiosOptions object.  Visit https://github.com/JustinBeckwith/gaxios.
  const url = 'https://people.googleapis.com/v1/people/me?personFields=names';
  const authRequest = await oAuth2Client.request({ url });
  console.log(authRequest.data);

  // After acquiring an access_token, you may want to check on the audience, expiration,
  // or original scopes requested.  You can do that with the `getTokenInfo` method.
  const tokenInfo = await oAuth2Client.getTokenInfo(
    oAuth2Client.credentials.access_token
  );
  console.log(tokenInfo);

  /**
  * Create a new OAuth2Client, and go through the OAuth2 content
  * workflow.  Return the full client to the callback.
  */
  function getAuthenticatedClient() {
    return new Promise((resolve, reject) => {
      // create an oAuth client to authorize the API call.  Secrets are kept in a `keys.json` file,
      // which should be downloaded from the Google Developers Console.
      const oAuth2Client = new OAuth2Client(
        clientId,
        clientSecret,
        authUri,
        tokenUri,
        redirectUri,
        javascriptOrigins
      );

      // Generate the url that will be used for the consent dialog.
      const authorizeUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/spreadsheets.readonly',
          'https://www.googleapis.com/auth/drive.metadata.readonly',
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo',
          'https://www.googleapis.com/openid'
        ]
      });

      // Open an http server to accept the oauth callback. In this simple example, the
      // only request to our webserver is to /oauth2callback?code=<code>
      const server = http
        .createServer(async (req, res) => {
          try {
            if (req.url.indexOf('/oauth2callback') > -1) {
              // acquire the code from the querystring, and close the web server.
              const qs = new url.URL(req.url, 'http://localhost:3000')
                .searchParams;
              const code = qs.get('code');
              console.log(`Code is ${code}`);
              res.end('Authentication successful! Please return to the console.');
              server.destroy();

              // Now that we have the code, use that to acquire tokens.
              const r = oAuth2Client.getToken(code);
              // Make sure to set the credentials on the OAuth2 client.
              oAuth2Client.setCredentials(r.tokens);
              console.info('Tokens acquired.');
              resolve(oAuth2Client);
            }
          } catch (e) {
            reject(e);
          }
        })
        .listen(3000, () => {
          // open the browser to the authorize url to start the workflow
          open(authorizeUrl, { wait: false }).then(cp => cp.unref());
        });
      destroyer(server);
    });
  }

  async function sendSmsFromSheet() {

    const tokenInfo = await oAuth2Client.getTokenInfo(
      oAuth2Client.credentials.access_token
    );
    console.log(tokenInfo);


    const sheets = google.sheets({
      version: 'v4',
      auth: oAuth2Client
    });

    // Lee datos de google sheet
    const sheetData = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
      fields: 'sheets(data(rowMetrics))',
    });

    //Agrega a la variable rows todo el contenido de la hoja de calculo
    const rows = sheetData.data.sheets[0].data[0].rowMetrics.lenght;

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

      // Check Si la fecha actual es estrictamente igual que un dia antes
      if (currentDate === oneDayBefore) {
        // Send an SMS message with Twilio
        await client.messages.create({
          to: phoneNumber,
          from: twilioPhoneNum,
          body: messageOneDay,
        });
      }

      // Check Si la fecha actual es estrictamente igual a 30 minutos antes
      if (currentDate === thirtyMinutesBefore) {
        // Send an SMS message with Twilio
        await client.messages.create({
          to: phoneNumber,
          from: twilioPhoneNum,
          body: messagethirtymin,
        });
      }
    }
  }

  app.get('/', sendSmsFromSheet)

}

main().catch(console.error);


// Programa el envio de los mensajes de texto por cron
exports.handler = async function (event, context) {
  const job = new cron.CronJob('0 0 * * *', sendSmsFromSheet, null, true, 'America/Bogota');
  job.start();
  return { statusCode: 200, body: 'SMS sending job started' }
}
