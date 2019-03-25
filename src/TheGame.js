class TheGame {
    constructor() {
        console.log('TheGame - constructor');
        this.background = null;
        this.land = null;
        this.tankBody = null;
        this.tankTurret = null;
        this.collisionGroup = null;
        this.cursors = null;
        this.spaceKey = null;
        this.spaceIsDown = false;
    }

    preload() {
        this.game.load.image('background', 'images/LowPolyMountain2.jpg');
        this.game.load.image('land', 'images/LowPolyMountain2-LandOnly.jpg');
        this.game.load.image('tankBody', 'images/tankBody.png');
        this.game.load.image('tankTurret', 'images/tankTurret.png');
        this.game.load.image('cannonBullet', 'images/CannonBullet.png');
    }

    create() {
        console.log('TheGame - create');
        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        this.collisionGroup = this.game.add.group();
        this.collisionGroup.enableBody = true;

        // background & land
        this.background = this.add.sprite(0, 0, 'background');
        this.land = this.collisionGroup.create(0, gameHeight - 76, 'land');
        this.land.body.immovable = true;

        // tank body
        this.tankBody = this.game.add.sprite(40, 550, 'tankBody');
        this.game.physics.arcade.enable(this.tankBody);
        this.tankBody.scale.setTo(0.3, 0.3);
        this.tankBody.body.bounce.y = 0.3;
        this.tankBody.body.gravity.y = 1000;
        this.tankBody.body.collideWorldBounds = true;
        // tank turret
        this.tankTurret = this.tankBody.addChild(this.game.make.sprite(120, 10, 'tankTurret'));

        // controls
        this.cursors = this.game.input.keyboard.createCursorKeys();
        this.spaceKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    }

    update() {
        this.game.physics.arcade.collide(this.tankBody, this.collisionGroup);

        this.tankBody.body.velocity.x = 0;
        if (this.cursors.left.isDown) {
            this.tankBody.body.velocity.x = -100;
        } else if (this.cursors.right.isDown) {
            this.tankBody.body.velocity.x = 100;
        }
        if (this.cursors.up.isDown && this.tankBody.body.touching.down) {
            this.tankBody.body.velocity.y = -500;
        }
        if (this.spaceKey.isDown && !this.spaceIsDown) {
            this.spaceIsDown = true;
            this.fire();
        }
        if (this.spaceKey.isUp) {
            this.spaceIsDown = false;
        }
    }

    paused() {
        console.log('TheGame - paused');
    }

    resumed() {
        console.log('TheGame - resumed');
    }

    fire() {
        console.log('fire');
    }
}
