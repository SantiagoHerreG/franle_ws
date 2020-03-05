#!/usr/bin/env node

const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
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
let matchingProfile = "";
let userProfile = "";

const wss = new WebSocket.Server({
  port: 12345,
  clientTracking: true
  /* Use verifyClient for allowing the connections */
}, () => {
  console.log('Server started...');
  console.log('Listening on port 12345');
});

wss.on('connection', (socket, req) => {
  const id = uuidv4();
  connections[id] = socket;
  socket.id = id;
  console.log(req);
  console.log(`Client ${id} connected...`)

  socket.on('message', data => {
    console.log(`Client ${id}: ${data}`);

    if (!socket.free && !match[id]) {
      try {
        data = JSON.parse(data);
        userProfile = data.nativeLang + "To" + data.newLang;
        socket.userProfile = userProfile;
        matchingProfile = data.newLang + "To" + data.nativeLang;
        if (!candidates[matchingProfile] || !candidates[userProfile]) {
          throw "Invalid language code";
        }
      } catch {
        socket.close();
        socket.userProfile = "engTospa";
        return;
      }

      if (candidates[matchingProfile].length) {
        candPool = Math.min(20, candidates[matchingProfile].length);
        keyPlace = Math.floor(Math.random() * (candPool));
        key = candidates[matchingProfile][keyPlace];
        match[id] = key;
        match[key] = id;
        /*Delete the key from candidates*/
        candidates[matchingProfile].splice(keyPlace, 1);
        console.log("Matched!");
        socket.send("Local ID and paired ID");
        socket.send(socket.id);
        socket.send(key);
        socketPaired = connections[key];
        socketPaired.send("Local ID and paired ID");
        socketPaired.send(key);
        socketPaired.send(socket.id);
        return;
      }
      console.log("new user and no match found");
      candidates[userProfile].push(id);
      socket.free = true;
    } else if (match[id]) {
      pairedId = match[id];
      pairedSocket = connections[pairedId];
      pairedSocket.send(data);
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
      pairedId = match[id];
      pairedSocket = connections[pairedId];
      pairedSocket.close(1000, "User2 has left");
      delete match[id];
      delete match[pairedId];
      delete connections[pairedId]
    } else {
      idx = candidates[socket.userProfile].indexOf(id);
      if (idx > -1) {
        candidates[socket.userProfile].splice(idx, 1);
      }
    }
  });
});

wss.on('error', _ => {
  return;
});
