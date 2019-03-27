let game;

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
        this.initialTankPositionX = null;
        // multiplayer
        this.socket = null;
        this.enemies = [];
        this.prevPos = null;
        this.playerId = null;
        game = this;
    }

    preload() {
        this.game.load.image('background', 'assets/LowPolyMountain2.jpg');
        this.game.load.image('land', 'assets/LowPolyMountain2-LandOnly.jpg');
        this.game.load.image('tankBody', 'assets/tankBody.png');
        this.game.load.image('tankTurret', 'assets/tankTurret.png');
        this.game.load.image('tankBody_Enemy', 'assets/tankBody_Enemy.png');
        this.game.load.image('tankTurret_Enemy', 'assets/tankTurret_Enemy.png');
        this.game.load.image('cannonBullet', 'assets/CannonBullet.png');
        this.game.load.image('explosion', 'assets/Explosion1.gif');
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
        this.initialTankPositionX = Math.round((gameWidth-200) * Math.round(Math.random())) + 50; // 2 random positions
        this.tankBody = this.game.add.sprite(this.initialTankPositionX, 550, 'tankBody');
        this.game.physics.arcade.enable(this.tankBody);
        this.tankBody.scale.setTo(0.3, 0.3);
        this.tankBody.body.bounce.y = 0.3;
        this.tankBody.body.gravity.y = 1000;
        this.tankBody.body.collideWorldBounds = true;
        // tank turret
        this.tankTurret = this.tankBody.addChild(this.game.make.sprite(120, 10, 'tankTurret'));
        // multiplayer
        this.prevPos = {
            x: this.tankBody.x,
            y: this.tankBody.y,
            turretAngle: this.tankTurret.rotation
        };

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
        this.socket.on('new shoot', this.onShootCannonball);
        this.socket.on('remove player', this.onRemovePlayer);
    }

    update() {
        // collision
        this.game.physics.arcade.collide(this.tankBody, this.collisionGroup);
        this.enemies.forEach(player => {
            this.game.physics.arcade.collide(player.tankBody, this.collisionGroup);
            this.game.physics.arcade.collide(player.tankBody, this.tankBody); // TODO: if(collide===true) notify the other players
        });
        this.bullets.forEach((bullet, index, list) => {
            if (bullet.body.x < 0 || bullet.body.x > gameWidth || bullet.body.y < 0) {
                list.splice(index, 1);
                return;
            }
            const hitLand = this.game.physics.arcade.collide(bullet, this.collisionGroup);
            // this tank
            const hitTank = this.game.physics.arcade.collide(bullet, this.tankBody);
            // multiplayer
            let hitOtherPlayer;
            for (let tank of this.enemies) {
                hitOtherPlayer = this.game.physics.arcade.collide(bullet, tank);
                if (hitOtherPlayer) {
                    break;
                }
            }

            if (hitLand || hitTank || hitOtherPlayer) {
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

            // multiplayer
            if (this.tankBody.x !== this.prevPos.x || this.tankBody.y !== this.prevPos.y || this.tankTurret.rotation !== this.prevPos.turretAngle) {
                this.socket.emit('move player', {
                    x: this.tankBody.x,
                    y: this.tankBody.y,
                    turretAngle: this.tankTurret.rotation
                });
                this.prevPos = {
                    x: this.tankBody.x,
                    y: this.tankBody.y,
                    turretAngle: this.tankTurret.rotation
                };
            }
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

        // multiplayer
        this.socket.emit('new shoot', {x: bullet.x, y: bullet.y, angle: this.tankTurret.rotation});
    }

    resetTankPosition() {
        this.tankBody.reset(this.initialTankPositionX, 550);
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
        console.log('connected to server');
        game.enemies.forEach(enemy => enemy.player.kill());
        game.enemies = [];
        const socket = game.socket.emit('new player', {x: game.tankBody.x, y: game.tankBody.y, turretAngle: game.tankTurret.rotation});
        game.playerId = socket.id;
    }

    onSocketDisconnect() {
        console.log('disconnected from server')
    }

    onNewPlayer(data) {
        if (data.id === game.playerId) {
            console.log("You are online: " + data.id);
            return;
        }
        console.log(`new player connected: ${data.id}`);
        var duplicate = game.getEnemyById(data.id);
        if (duplicate) {
            console.log('duplicate player!');
            return;
        }
        game.enemies.push(new RemotePlayer(data.id, game, data, data.x, data.y, data.turretAngle));
    }

    onMovePlayer(data) {
        if (data.id === game.playerId) {
            return;
        }
        const movePlayer = game.getEnemyById(data.id);
        if (!movePlayer) {
            console.log(`player not found: ${data.id}`);
            return;
        }

        movePlayer.tankBody.x = data.x;
        movePlayer.tankBody.y = data.y;
        movePlayer.tankTurret.rotation = data.turretAngle;
    }

    onShootCannonball(data) {
        if (data.id === game.playerId) {
            return;
        }

        const p = new Phaser.Point(data.x, data.y);
        p.rotate(p.x, p.y, data.angle, false, 34);
        let bullet = game.createBullet(p.x, p.y);
        game.bullets.push(bullet);
        game.physics.arcade.velocityFromRotation(data.angle, 1000, bullet.body.velocity);
    }

    onRemovePlayer(data) {
        if (data.id === game.playerId) {
            return;
        }
        console.log(`remove player: ${data.id}`);
        var removePlayer = game.getEnemyById(data.id);
        if (!removePlayer) {
            console.log(`player not found: ${data.id}`);
            return;
        }
        removePlayer.player.kill();
        game.enemies.splice(game.enemies.indexOf(removePlayer), 1);
    }

    getEnemyById(id) {
        for (var i = 0; i < game.enemies.length; i++) {
            if (game.enemies[i].player.id === id) {
                return game.enemies[i];
            }
        }
        return false
    }
}
