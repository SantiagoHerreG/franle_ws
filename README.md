# FRANLE mobile app

## Share and learn languages anonymously

### Web sockets Server Usage
run with `npm start`

install ws with `npm install -g ws`
install wscat with `npm install -g wscat`

Connect to the server using `wscat -c ws://0.0.0.0:12345`

The first message should be a json format string containing native language and new language:
e.g.:`{"nativeLang":"spa", "newLang":"eng"}`

Allowed language codes:
+ spa
+ eng
+ deu
+ fr
