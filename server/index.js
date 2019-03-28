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
      client.on('new player', (player) => onNewPlayer(client, player));
      client.on('remove player', () => onRemovePlayer(client));
      client.on('disconnect', () => onRemovePlayer(client));
      client.on('move player', (player) => onMovePlayer(client, player));
      client.on('new shoot', (shoot) => onShootCannonball(client, shoot));
      client.on('health change', (player) => onHealthChange(client, player));
    });
    addCloud();
  });

class Player {
  constructor(startX, startY, turretAngle, healthCount, tankDirection) {
    this.x = startX;
    this.y = startY;
    this.turretAngle = turretAngle;
    this.healthCount = healthCount;
    this.tankDirection = tankDirection;
  }
}

const players = {};

const onNewPlayer = (ioClient, player) => {
  log(`new player: ${ioClient.id}`);
  const newPlayer = new Player(player.x, player.y, player.turretAngle, player.healthCount, player.tankDirection);
  newPlayer.id = ioClient.id;
  io.emit('new player', newPlayer);
  Object.getOwnPropertyNames(players).forEach(id => ioClient.emit('new player', players[id]));
  players[newPlayer.id] = newPlayer;
};

function onMovePlayer(ioClient, player) {
  log(`moving player: ${ioClient.id}`);
  const moveTank = players[ioClient.id];
  if (!moveTank) {
    log(`player not found: ${ioClient.id}`);
    return;
  }
  Object.assign(moveTank, player);
  io.emit('move player', moveTank);
}

function onShootCannonball(ioClient, shoot) {
  log(`new shoot: ${ioClient.id}`);
  shoot.id = ioClient.id;
  io.emit('new shoot', shoot);
}

const onRemovePlayer = client => {
  log(`removing player: ${client.id}`);
  const removePlayer = players[client.id];
  if (!removePlayer) {
    log(`player not found: ${client.id}`);
    return;
  }
  delete players[client.id];
  io.emit('remove player', removePlayer);
};

function addCloud() {
  setTimeout(() => {
    if (!isEmpty(players)) {
      log(`add cloud`);
      const leftSide = Math.round(Math.random()) === 0;
      const yOffset = Math.round(Math.random() * 200) - 100;
      io.emit('add cloud', {leftSide, yOffset});
    }
    addCloud();
  }, 1000);
}

function onHealthChange(ioClient, player) {
  log(`health change: ${ioClient.id}`);
  player.id = ioClient.id;
  io.emit('health change', player);
}

function isEmpty(obj) {
  for (let property in obj) {
    return false;
  }
  return true;
}
