# FRANLE mobile app

## Share and learn languages anonymously. Web sockets is the protocol to establish fast and secure connections between clients. This project is part of Holberton Schoolfoundations coursework.

### Web sockets Server Usage
git clone [path/repo]
install ws with `npm install`

### Web sockets Server Usage
run with `npm start`

install wscat with `npm install -g wscat`

Connect to the server using `wscat -c ws://0.0.0.0:12345`

The first message should be a json format string containing native language and new language:
e.g.:`{"nativeLang":"spa", "newLang":"eng", "username":"userX"}`

Allowed language codes:
+ spa
+ eng
+ deu
+ fr

After the first message, if paired you receive the chatID, else you wait for matching.
This server requests to an API running on 35.190.175.59.

When paired, messages have to be a json format string: {"username":"sherre", "message":"hello"}
