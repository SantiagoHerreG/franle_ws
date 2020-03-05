# FRANLE mobile app

## Share and learn languages anonymously

### Web sockets Server Usage
run with `npm start`

install wscat with `wscat install -g wscat`

Connect to the server using `wscat -c ws://0.0.0.0:12345`

The first message should be a json format string containing native language and new language:
e.g.:`{"nativeLang":"esp", "newLang":"eng"}`
