class TheGame {
    constructor() {
        console.log('TheGame - constructor');
        this.background = null;
        this.land = null;
        this.tankBody = null;
        this.tankTurret = null;
        this.collisionGroup = null;
    }

    preload() {
        this.game.load.image('background', 'images/LowPolyMountain2.jpg');
        this.game.load.image('land', 'images/LowPolyMountain2-LandOnly.jpg');
        this.game.load.image('tankBody', 'images/tankBody.png');
        this.game.load.image('tankTurret', 'images/tankTurret.png');
    }

    create() {
        console.log('TheGame - create');
        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        this.collisionGroup = this.game.add.group();
        this.collisionGroup.enableBody = true;
        // background & land
        this.background = this.add.sprite(0, 0, 'background');
        this.land = this.collisionGroup.create(0, gameHeight-76, 'land');
        this.land.body.immovable = true;

        // tank body
        this.tankBody = this.game.add.sprite(40, 550, 'tankBody');
        this.game.physics.arcade.enable(this.tankBody);
        this.tankBody.scale.setTo(0.3, 0.3);
        this.tankBody.body.bounce.y = 0.2;
        this.tankBody.body.gravity.y = 300;
        this.tankBody.body.collideWorldBounds = true;
        // tank turret
        this.tankTurret = this.tankBody.addChild(this.game.make.sprite(120, 10, 'tankTurret'));
    }

    update() {
        this.game.physics.arcade.collide(this.tankBody, this.collisionGroup);
    }

    paused() {
        console.log('TheGame - paused');
    }

    resumed() {
        console.log('TheGame - resumed');
    }
}
