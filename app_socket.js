const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
let connections = {};
let freeConn = {};
let match = {};

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

  console.log(`Client ${id} connected...`)

  socket.on('message', data => {
    console.log(`Client ${id}: ${data}`);
    if (!freeConn[id] && !match[id]) {
      data = JSON.parse(data);
      freeConn[id] = [data.nativeLang, data.newLang];
      for (var [key, value] of Object.entries(freeConn)) {
        if (key != id && value[1] === data.nativeLang && value[0] === data.newLang) {
          match[id] = key;
          match[key] = id;
          delete freeConn[id];
          console.log("Matched!");
          socket.send("id", socket.id);
          socket.send("paired", key);
          return;
        }
      }
      console.log("new user and no match found");
    } else if (match[id]) {
      pairedId = match[id];
      pairedSocket = connections[pairedId];
      pairedSocket.send(data);
      console.log("data sent");
    }
    console.log("freeconn", freeConn);
    console.log("match", match);
  });

  socket.on('ping', _ => {
    socket.send(`${wss.clients.size} clients connected`);
    console.log(connections);
  });

  socket.on('close', _ => {
    console.log(`Client ${id} leaving...`)
  });
});
