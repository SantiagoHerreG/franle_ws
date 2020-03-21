const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

/* hash tables (data structures) to store data and retrieve it fast*/
let connections = {};
let match = {};
let candidates = {
  "engTospa": [],
  "spaToeng": [],
  "frToeng": [],
  "engTofr": [],
  "deuTofr": [],
  "frTodeu": [],
  "spaTofr": [],
  "spaTodeu": [],
  "engTodeu": [],
  "frTospa": [],
  "deuTospa": [],
  "deuToeng": [],
}

/*Each user has a language profile and matching profile
Ex: userProfile = spaToeng, matchingProfile = engTospa */
let matchingProfile = "";
let userProfile = "";

const port = 12345;

/*Web sockets server*/
const wss = new WebSocket.Server({
  port: port,
  clientTracking: true
  /* Use verifyClient for allowing the connections */
}, () => {
  console.log('Server started...');
  console.log('Listening on port', port);
});

/*Web socket actions are:
-connection
-error*/
wss.on('connection', (socket, req) => {

  /* The userID is stored on connections table*/
  const id = uuidv4();
  connections[id] = socket;
  /*Each socket has an attribute as its own ID*/
  socket.id = id;
  console.log(req);
  console.log(`Client ${id} connected...`)

  /* Sockets have the following actions:
  -On message: a user connected has sent a message
  -On error: an error ocurred
  -On close: the connection is gonna be closed
  -On ping: returns how many clients connected*/
  socket.on('message', data => {
    console.log(`Client ${id}: ${data}`);

    /* Every message is parsed from JSON format string*/
    data = JSON.parse(data);

    /* On connection, the first message has the format
    {"username":str, "nativeLang":code, "newLang":code}
    Every message has the format
    {"message":str, "username":str}*/
    if (!data.message) {
      try {
        userProfile = data.nativeLang + "To" + data.newLang;
        socket.username = data.username;
        socket.userProfile = userProfile;
        matchingProfile = data.newLang + "To" + data.nativeLang;
        if (!candidates[matchingProfile] || !candidates[userProfile]) {
          throw "Invalid language code";
        }
      } catch {
        socket.userProfile = "engTospa";
        socket.close();
        return;
      }

      /* candidates is the hash table containing waiting clients*/
      if (candidates[matchingProfile].length) {

        /* Random matching implemented */
        candPool = Math.min(20, candidates[matchingProfile].length);
        keyPlace = Math.floor(Math.random() * (candPool));
        key = candidates[matchingProfile][keyPlace];

        match[id] = key;
        match[key] = id;

        /*Delete the previously waiting key from candidates*/
        candidates[matchingProfile].splice(keyPlace, 1);
        console.log("Matched!");

        /* A new chat is POST to the API*/
        usernameB = connections[key].username;
        axios.post('http://35.190.175.59/chats', {
          usernameA: socket.username,
          usernameB: usernameB
        })
        .then((response) => {
          console.log("Axios post chat", response);
          socket.send(JSON.stringify(response.data));
          socket.chatId = response.data._id;
          connections[key].send(JSON.stringify(response.data));
          connections[key].chatId = response.data._id;
        })
        .catch((error) => {
          console.log(error);
          socket.close();
        });
        return;
      }
      console.log("new user and no match found");
      candidates[userProfile].push(id);
      socket.used = true;

    } else if (match[id]) {

      /* If the match is already done,
      POST a new message to the current chat using the API
      and send the message to the paired client*/
      pairedId = match[id];
      pairedSocket = connections[pairedId];
      axios.post('http://35.190.175.59/message/' + socket.chatId, data)
      .then((response) => {
        console.log("Axios post message", response.data);
      })
      .catch((error) => {
        console.log(error);
        socket.send('Error saving the last message');
      });
 
      pairedSocket.send(data.message);
      console.log("data sent");
    }
    console.log("candidates", candidates);
    console.log("match", match);
  });

  socket.on('ping', _ => {
    socket.send(`${wss.clients.size} clients connected`);
    console.log(connections);
  });

  socket.on('error', _ => {
    socket.close();
  });

  socket.on('close', _ => {
    console.log(`Client ${id} leaving...`)

    delete connections[id];

    if (match[id]) {
      /* Deletes the current chat from the database */
      axios.delete('http://35.190.175.59/chats/' + socket.chatId)
      .then((response) => {
        console.log("Axios delete chat", socket.chatId, response.data);
      })
      .catch((error) => {
        console.log("The chat could not be deleted");
        console.log(error);
      });

      /* The paired client is automaticly closed */
      pairedId = match[id];
      pairedSocket = connections[pairedId];
      pairedSocket.close(1000, "User2 has left");
      delete match[id];
      delete match[pairedId];
      delete connections[pairedId]

    } else {

      /* The user is removed from waiting candidates*/
      if (socket.userProfile && candidates[socket.userProfile]) {
        idx = candidates[socket.userProfile].indexOf(id);
        if (idx > -1) {
          candidates[socket.userProfile].splice(idx, 1);
        }
      }
    }
  });
});

wss.on('error', _ => {
  return;
});
