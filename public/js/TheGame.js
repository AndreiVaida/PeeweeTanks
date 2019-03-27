class TheGame {
    constructor() {
        console.log('TheGame - constructor');
        this.background = null;
        this.land = null;
        this.tankBody = null;
        this.tankTurret = null;
        this.bullets = [];
        this.collisionGroup = null;
        this.cursors = null;
        this.spaceKey = null;
        this.healthCount = 100;
        this.healthIndicator = null;
        // multiplayer
        this.socket = null;
        this.enemies = [];
    }

    preload() {
        this.game.load.image('background', 'images/LowPolyMountain2.jpg');
        this.game.load.image('land', 'images/LowPolyMountain2-LandOnly.jpg');
        this.game.load.image('tankBody', 'images/tankBody.png');
        this.game.load.image('tankTurret', 'images/tankTurret.png');
        this.game.load.image('cannonBullet', 'images/CannonBullet.png');
        this.game.load.image('explosion', 'images/Explosion1.gif');
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
        const x = Math.round((gameWidth-200) * Math.round(Math.random())); // 2 random positions
        this.tankBody = this.game.add.sprite(x, 550, 'tankBody');
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
        this.aKey = this.game.input.keyboard.addKey(Phaser.Keyboard.A);
        this.dKey = this.game.input.keyboard.addKey(Phaser.Keyboard.D);
        this.rKey = this.game.input.keyboard.addKey(Phaser.Keyboard.R);

        this.background.inputEnabled = true;
        this.background.events.onInputDown.add(this.clickListener, this);

        // screen text
        this.healthIndicator = this.add.text(8, 8, 'Health: ' + this.healthCount + '%', { font: "18px Century Gothic", fill: "#ffffff" });

        // multiplayer
        this.socket = io.connect();
        this.socket.on('connect', this.onSocketConnected);
        this.socket.on('disconnect', this.onSocketDisconnect);
        this.socket.on('new player', this.onNewPlayer);
        this.socket.on('move player', this.onMovePlayer);
        this.socket.on('remove player', this.onRemovePlayer);
    }

    update() {
        // collision
        this.game.physics.arcade.collide(this.tankBody, this.collisionGroup);
        this.bullets.forEach((bullet, index, list) => {
            if (bullet.body.x < 0 || bullet.body.x > gameWidth || bullet.body.y < 0) {
                list.splice(index, 1);
                return;
            }
            const hitLand = this.game.physics.arcade.collide(bullet, this.collisionGroup);
            const hitTank = this.game.physics.arcade.collide(bullet, this.tankBody);
            if (hitLand || hitTank) {
                this.explode(bullet);
                if (hitTank) {
                    this.giveDamage();
                }
                list.splice(index, 1);
            }
        });

        // tank movement
        if (this.tankBody.body) {
            this.tankBody.body.velocity.x = 0;
            if (this.cursors.left.isDown || this.aKey.isDown) {
                this.tankBody.body.velocity.x = -100;
            } else if (this.cursors.right.isDown || this.dKey.isDown) {
                this.tankBody.body.velocity.x = 100;
            }
            if (this.spaceKey.isDown && this.tankBody.body.touching.down) {
                this.tankBody.body.velocity.y = -500;
            }
            if (this.rKey.isDown) {
                this.resetTankPosition()
            }

            // turret rotation
            this.tankTurret.rotation = this.game.physics.arcade.angleToPointer(this.tankBody);
        }
    }

    paused() {
        console.log('TheGame - paused');
    }

    resumed() {
        console.log('TheGame - resumed');
    }

    createBullet(x, y) {
        let bullet = this.add.sprite(x, y, 'cannonBullet');
        this.game.physics.arcade.enable(bullet);
        bullet.scale.setTo(0.2, 0.2);
        bullet.body.bounce.y = 0.3;
        bullet.body.gravity.y = 1000;
        bullet.body.collideWorldBounds = false;
        return bullet;
    }

    clickListener() {
        if (this.tankBody.body) {
            this.fire();
        }
    }

    fire() {
        const p = new Phaser.Point(this.tankBody.x + 30, this.tankBody.y - 3);
        p.rotate(p.x, p.y, this.tankTurret.rotation, false, 34);
        let bullet = this.createBullet(p.x, p.y);
        this.bullets.push(bullet);
        this.physics.arcade.velocityFromRotation(this.tankTurret.rotation, 1000, bullet.body.velocity);
    }

    resetTankPosition() {
        this.tankBody.reset(40, 550);
    }

    explode(objectToExplode, size = 1) {
        const x = objectToExplode.x - 90*size;
        const y = objectToExplode.y - 180*size;
        objectToExplode.destroy();
        const explosion = this.add.sprite(x, y, 'explosion');
        explosion.scale.setTo(size, size);
        this.add.tween(explosion).to( { alpha: 0 }, 500, "Linear", true);
        setTimeout(() => {
            explosion.destroy();
        }, 500);
    }

    giveDamage() {
        this.healthCount -= 25;
        if (this.healthCount < 0) {
            this.healthCount = 0;
        }
        this.healthIndicator.text = 'Health: ' + this.healthCount + '%';

        if (this.healthCount === 0) {
            this.destroyTank();
        }
    }

    destroyTank() {
        this.explode(this.tankBody, 2);
        setTimeout(() => {
            alert("GAME OVER");
        }, 1000);
    }

    /* MULTIPLAYER */
    onSocketConnected() {
        log('connected to server');
        this.enemies.forEach(enemy => enemy.player.kill());
        this.enemies = [];
        socket.emit('new player', {x: this.tankBody.x, y: this.tankBody.y});
    }

    onSocketDisconnect() {
        log('disconnected from server')
    }

    onNewPlayer(data) {
        log(`new player connected: ${data.id}`);
        var duplicate = playerById(data.id);
        if (duplicate) {
            log('duplicate player!');
            return;
        }
        enemies.push(new RemotePlayer(data.id, game, player, data.x, data.y, data.angle));
    }

    onMovePlayer(data) {
        log(`move player: ${data.id}`);
        var movePlayer = playerById(data.id);
        if (!movePlayer) {
            log(`player not found: ${data.id}`);
            return;
        }
        movePlayer.player.x = data.x;
        movePlayer.player.y = data.y;
        movePlayer.player.angle = data.angle;
    }

    onRemovePlayer(data) {
        log(`remove player: ${data.id}`);
        var removePlayer = playerById(data.id);
        if (!removePlayer) {
            log(`player not found: ${data.id}`);
            return;
        }
        removePlayer.player.kill()
        enemies.splice(enemies.indexOf(removePlayer), 1)
    }
}
