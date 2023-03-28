# hcrwappandsms

## Herramienta de Confirmación de Reservas por medio de WhatsApp y Mensajes de Texto.


## Guia de implementacion

- Para hacer funcionar este aplicativo web, debemos usar google forms, google sheet y twilio.
- Debemos crear un formulario el cual tendremos conectado a sheet con make integromat, esto nos facilitara la labor de hacerlo nosotros mismos.
- Luego de tener cada registro reflejado en nuestra hoja de calculo debemos descargar este repo e iniciar la instalacion de este.
- Para iniciar la instalacion de este aplicativo web debemos tener en la maquina local instalado **NodeJS** de manera local en nuestro equipo.
- Luego estando en el directorio dentro de la carpeta que se descarga de **Github**, en el caso de ponerle un nombre propio al repo seria hcrwappandsms.
- Una vez estando dentro dentro de la carpeta iniciamos una terminal de windows o con la terminal integrada del IDE de su eleccion *codeamos* **npm i** o escribimos npm install, esto instalara todos las dependencias que necesite el aplicativo web.
- Una vez terminado su instalacion debemos tener una cuenta en google cloud para acceder a los credenciales de google que proporciona. Una vez tengamos creado un aplicativo dentro de la biblioteca de apis de google o google cloud debemos descargarlos y colocarlos dentro de la carpeta **hcrwappandsms.
- Tener encuenta que debemos editar los credenciales de google que vendria siendo un archivo en formato **Json** el contendra nuestros credenciales de acceso y autenticacion.
- Editamos el **Json** para incluir tambien los credenciales de twilio.
- Para obtener los credenciales de twilio debemos crear una cuenta la cual nos dara una prueba gratuita, tendra limitaciones, solo podremos enviar los mensajes de texto a las personas que tengamos su numero registrado en twilio o los mensajes de texto nunca llegan al destino.
- Ejecutamos con npm run start el servidor el cual estara enviando por mensajes de texto el recordatorio de la cita.

### Gracias por considerar este repo una forma de crear soluciones baratas para la automatizacion de procesos repetitivos en pequeñas empresas.
