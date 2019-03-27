const log = console.log;
const http = require('http');
const path = require('path');
const ecstatic = require('ecstatic');
const socketIo = require('socket.io');

let io;

const server = http.createServer(ecstatic({root: path.resolve(__dirname, '../public')}))
  .listen(3000, () => {
    io = socketIo.listen(server);
    io.on('connection', client => {
      client.on('disconnect', () => onRemoveTank(client));
      client.on('new player', (tank) => onNewTank(client, tank));
      client.on('move player', (tank) => onMoveTank(client, tank));
    })
  });

class Tank {
  constructor(startX, startY) {
    this.x = startX;
    this.y = startY;
  }
}

const tanks = {};

const onRemoveTank = client => {
  log(`removing tank: ${client.id}`);
  const removeTank = tanks[client.id];
  if (!removeTank) {
    log(`tank not found: ${client.id}`);
    return;
  }
  delete tanks[client.id];
  io.emit('remove tank', removeTank);
};

const onNewTank = (ioClient, tank) => {
  log(`new tank: ${ioClient.id}`);
  const newTank = new Tank(tank.x, tank.y);
  newTank.id = ioClient.id;
  io.emit('new tank', newTank);
  Object.getOwnPropertyNames(tanks).forEach(id => ioClient.emit('new tank', tanks[id]));
  tanks[newTank.id] = newTank;
};

function onMoveTank(ioClient, tank) {
  log(`moving tank: ${ioClient.id}`);
  const moveTank = tanks[ioClient.id];
  if (!moveTank) {
    log(`tank not found: ${ioClient.id}`);
    return;
  }
  Object.assign(moveTank, tank);
  io.emit('move tank', moveTank);
}
