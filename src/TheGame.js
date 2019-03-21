class TheGame {
  constructor() {
    console.log('TheGame - constructor');
    this.background = null;
    this.land = null;
    this.tankBody = null;
    this.tankTurret = null;
  }

  preload() {
    this.game.load.image('background', 'images/LowPolyMountain-WithDeepGround.jpg');
    this.game.load.image('land', 'images/LowPolyMountain-TerrainOnly.png');
    this.game.load.image('tankBody', 'images/tankBody.png');
    this.game.load.image('tankTurret', 'images/tankTurret.png');
  }

  create() {
    console.log('TheGame - create');
    // background & land
    //this.background = this.add.sprite(0, 0, 'background');
    this.land = this.add.bitmapData(gameWidth, gameHeight);
    this.land.draw('land');
    this.land.update();
    this.land.addToWorld();
    // tank
    this.tankTurret = this.add.sprite(40, 503, 'tankTurret');
    this.tankTurret.scale.setTo(0.3,0.3);
    this.tankBody = this.add.sprite(10, 500, 'tankBody');
    this.tankBody.scale.setTo(0.3,0.3);
    // physics
    this.game.physics.enable( [ this.tankBody, this.tankTurret ], Phaser.Physics.ARCADE);
    this.land.collideWorldBounds = true;
    this.tankBody.body.collideWorldBounds = true;
    this.tankBody.body.bounce.y = 0.2;
    this.tankBody.body.gravity.y = 400;
  }

  paused() {
    console.log('TheGame - paused');
  }

  resumed() {
    console.log('TheGame - resumed');
  }
}