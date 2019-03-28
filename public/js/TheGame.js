let game;

class TheGame {
    constructor() {
        console.log('TheGame - constructor');
        this.background = null;
        this.land = null;
        this.tankBody = null;
        this.tankTurret = null;
        this.bullets = null;
        this.clouds = null;
        this.collisionGroup = null;
        this.cursors = null;
        this.spaceKey = null;
        this.healthCount = null;
        this.healthIndicator = null;
        this.initialTankPositionX = null;
        this.explosion1Sound = null;
        this.gameSound = null;
        this.musicLost = null;
        this.tankDirection = null;
        // multiplayer
        this.socket = null;
        this.playerId = null;
        this.enemies = null;
        this.prevPos = null;
        game = this;
    }

    preload() {
        this.game.load.image('background', 'assets/LowPolyMountain2.jpg');
        this.game.load.image('land', 'assets/LowPolyMountain2-LandOnly.jpg');
        this.game.load.image('cloud', 'assets/Cloud.png');
        this.game.load.image('tankBody_right', 'assets/tankBody.png');
        this.game.load.image('tankBody_left', 'assets/tankBodyLeft.png');
        this.game.load.image('tankTurret', 'assets/tankTurret.png');
        this.game.load.image('tankBody_Enemy_right', 'assets/tankBody_Enemy.png');
        this.game.load.image('tankBody_Enemy_left', 'assets/tankBody_EnemyLeft.png');
        this.game.load.image('tankTurret_Enemy', 'assets/tankTurret_Enemy.png');
        this.game.load.image('cannonBullet', 'assets/CannonBullet.png');
        this.game.load.spritesheet('explosion', 'assets/Explosion1Sprite.png', 200, 200);
        this.game.load.spritesheet('colorExplosion', 'assets/ColorExplosionSprite.png', 500, 282);
        this.game.load.audio('explosion1Sound', 'assets/Explosion1.mp3');
        this.game.load.audio('menuSound', 'assets/music_race_loop.wav');
        this.game.load.audio('musicLost', 'assets/musicLost.mp3');
    }

    create() {
        console.log('TheGame - create');
        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        this.collisionGroup = this.game.add.group();
        this.collisionGroup.enableBody = true;
        this.explosion1Sound = this.game.sound.add("explosion1Sound");
        this.bullets = [];
        this.clouds = [];
        this.healthCount = 100;
        this.enemies = [];

        // sounds
        this.gameSound = this.game.sound.add("menuSound");
        this.gameSound.volume = 0.4;
        this.gameSound.loop = true;
        this.gameSound.play();
        this.musicLost = this.game.sound.add("musicLost");
        this.musicLost.loop = false;

        // background & land
        this.background = this.add.sprite(0, 0, 'background');
        this.land = this.collisionGroup.create(0, gameHeight - 76, 'land');
        this.land.body.immovable = true;

        // tank body
        this.initialTankPositionX = Math.round((gameWidth-200) * Math.round(Math.random())) + 50; // 2 random positions
        if (this.initialTankPositionX < gameWidth / 2) {
            this.tankBody = this.game.add.sprite(this.initialTankPositionX, 550, 'tankBody_right');
        } else {
            this.tankBody = this.game.add.sprite(this.initialTankPositionX, 550, 'tankBody_left');
        }
        this.game.physics.arcade.enable(this.tankBody);
        this.tankBody.scale.setTo(0.3, 0.3);
        this.tankBody.body.bounce.y = 0.3;
        this.tankBody.body.gravity.y = 1000;
        this.tankBody.body.collideWorldBounds = true;
        this.tankDirection = 'right';
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
        this.socket.on('add cloud', this.onAddCloud);
        this.socket.on('health change', this.onHealthChange);
    }

    update() {
        // collision
        this.game.physics.arcade.collide(this.tankBody, this.collisionGroup);
        this.enemies.forEach(player => {
            this.game.physics.arcade.collide(player.tankBody, this.collisionGroup);
            this.game.physics.arcade.collide(player.tankBody, this.tankBody);
        });
        this.bullets.forEach((bulletItem, index, list) => {
            if (bulletItem.bullet.body.x < 0 || bulletItem.bullet.body.x > gameWidth || bulletItem.bullet.body.y < 0) {
                list.splice(index, 1);
                return;
            }
            const hitLand = this.game.physics.arcade.collide(bulletItem.bullet, this.collisionGroup);
            // this tank
            const hitTank = this.game.physics.arcade.collide(bulletItem.bullet, this.tankBody);
            // other tanks
            let hitOtherPlayer;
            for (let player of this.enemies) {
                hitOtherPlayer = this.game.physics.arcade.collide(bulletItem.bullet, player.tankBody);
                if (hitOtherPlayer) {
                    break;
                }
            }
            // clouds
            let hitCloud = null;
            this.clouds.forEach((cloud, index, list) => {
                const hit = this.game.physics.arcade.collide(bulletItem.bullet, cloud);
                if (hit) {
                    hitCloud = cloud;
                    list.splice(index, 1);
                    return;
                }
            });

            if (hitLand || hitTank || hitOtherPlayer || hitCloud) {
                if (hitLand || hitTank || hitOtherPlayer) {
                    this.explode(bulletItem.bullet);
                }
                if (hitTank) {
                    this.giveDamage(25);
                    this.socket.emit('health change', {healthCount: this.healthCount});
                }
                if (hitCloud) {
                    this.explode(hitCloud, 'color');
                    bulletItem.bullet.destroy();
                    if (bulletItem.playerId === this.playerId) {
                        this.addLife(10);
                        this.socket.emit('health change', {healthCount: this.healthCount});
                    }
                }
                list.splice(index, 1);
            }
        });

        // tank movement
        if (this.tankBody.body) {
            this.tankBody.body.velocity.x = 0;
            if (this.cursors.left.isDown || this.aKey.isDown) {
                this.tankBody.body.velocity.x = -100;
                if (this.tankDirection === 'right') {
                    this.tankBody.loadTexture('tankBody_left');
                    this.tankDirection = 'left';
                }
            } else if (this.cursors.right.isDown || this.dKey.isDown) {
                this.tankBody.body.velocity.x = 100;
                if (this.tankDirection === 'left') {
                    this.tankBody.loadTexture('tankBody_right');
                    this.tankDirection = 'right';
                }
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
                    turretAngle: this.tankTurret.rotation,
                    tankDirection: this.tankDirection
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
        this.bullets.push({
            playerId: game.playerId,
            bullet: bullet
        });
        this.physics.arcade.velocityFromRotation(this.tankTurret.rotation, 1000, bullet.body.velocity);

        // multiplayer
        this.socket.emit('new shoot', {x: bullet.x, y: bullet.y, angle: this.tankTurret.rotation, playerId: this.playerId});
    }

    resetTankPosition() {
        this.tankBody.reset(this.initialTankPositionX, 550);
    }

    explode(objectToExplode, explosionType = 'fire', size = 0.5) {
        let x = objectToExplode.x - 90 * size;
        let y = objectToExplode.y - 180 * size;
        objectToExplode.destroy();
        let explosion;
        if (explosionType === 'color') {
            x -= 70 * size; // -150
            y += 60 * size; // -20
            explosion = this.add.sprite(x, y, 'colorExplosion');
            this.add.tween(explosion).to( { alpha: 0 }, 500, "Linear", true);
        } else {
            explosion = this.add.sprite(x, y, 'explosion');
        }
        explosion.scale.setTo(size, size);
        // this.add.tween(explosion).to( { alpha: 0 }, 500, "Linear", true);
        // explosion.animations.add('explode', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25], 60, false);
        explosion.animations.add('explode');
        explosion.play('explode');
        this.explosion1Sound.play();
        setTimeout(() => {
            explosion.destroy();
        }, 1000);
    }

    giveDamage(ammount) {
        this.healthCount -= ammount;
        if (this.healthCount < 0) {
            this.healthCount = 0;
        }
        this.healthIndicator.text = 'Health: ' + this.healthCount + '%';

        if (this.healthCount === 0) {
            this.destroyTank();
            this.socket.emit('remove player');
        }
    }

    addLife(ammount) {
        this.healthCount += ammount;
        if (this.healthCount > 100) {
            this.healthCount = 100;
        }
        this.healthIndicator.text = 'Health: ' + this.healthCount + '%';
    }

    destroyTank() {
        this.explode(this.tankBody, 2);
        game.musicLost.play();
        setTimeout(() => {
            alert("GAME OVER");
            this.goToHomeScreen();
        }, 1000);
    }

    /* MULTIPLAYER */
    onSocketConnected() {
        console.log('connected to server');
        game.enemies = [];
        const socket = game.socket.emit('new player', {
            x: game.tankBody.x,
            y: game.tankBody.y,
            turretAngle: game.tankTurret.rotation,
            healthCount: game.healthCount,
            tankDirection: game.tankDirection,
        });
        game.playerId = socket.io.engine.id;
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
        const duplicate = game.getEnemyById(data.id);
        if (duplicate) {
            console.log('duplicate player!');
            return;
        }
        game.enemies.push(new RemotePlayer(data.id, game, data, data.x, data.y, data.turretAngle, data.healthCount));
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
        if (movePlayer.tankDirection !== data.tankDirection) {
            if (data.tankDirection === 'left') {
                movePlayer.tankBody.loadTexture('tankBody_Enemy_left');
            } else {
                movePlayer.tankBody.loadTexture('tankBody_Enemy_right');
            }
        }
        movePlayer.tankDirection = data.tankDirection;
    }

    onShootCannonball(data) {
        if (data.id === game.playerId) {
            return;
        }

        const p = new Phaser.Point(data.x, data.y);
        p.rotate(p.x, p.y, data.angle, false, 34);
        let bullet = game.createBullet(p.x, p.y);
        game.bullets.push({
            playerId: data.playerId,
            bullet: bullet
        });
        game.physics.arcade.velocityFromRotation(data.angle, 1000, bullet.body.velocity);
    }

    onRemovePlayer(data) {
        if (data.id === game.playerId) {
            return;
        }
        console.log(`remove player: ${data.id}`);
        const removePlayer = game.getEnemyById(data.id);
        if (!removePlayer) {
            console.log(`player not found: ${data.id}`);
            return;
        }
        game.explode(removePlayer.tankBody, 2);
        game.enemies.splice(game.enemies.indexOf(removePlayer), 1);

        if (game.enemies.length === 0) {
            setTimeout(() => {
                if (game.tankBody.body) {
                    alert("YOU WON !");
                }
                game.goToHomeScreen();
            }, 1000);
        }
    }

    goToHomeScreen() {
        this.gameSound.stop();
        this.socket.emit('remove player');
        this.socket.close();
        this.game.state.start('HomePage');
    }

    getEnemyById(id) {
        for (var i = 0; i < game.enemies.length; i++) {
            if (game.enemies[i].player.id === id) {
                return game.enemies[i];
            }
        }
        return false
    }

    onAddCloud(data) {
        let x = gameWidth;
        if (data.leftSide) {
            x = 0 - 66;
        }
        let cloud = game.add.sprite(x, 200 + data.yOffset, 'cloud');
        game.game.physics.arcade.enable(cloud);
        if (data.leftSide) {
            cloud.body.velocity.x = 50;
        }
        else {
            cloud.body.velocity.x = -50;
        }
        game.clouds.push(cloud);
    }

    onHealthChange(data) {
        if (data.id === game.playerId) {
            return;
        }
        const player = game.getEnemyById(data.id);
        if (!player) {
            console.log(`player not found: ${data.id}`);
            return;
        }
        player.healthIndicator.text = data.healthCount + "%";
    }
}
