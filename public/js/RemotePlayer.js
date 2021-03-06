const RemotePlayer = function (index, game, player, startX, startY, startTurretAngle, startHealth, startTankDirection) {
    const x = startX;
    const y = startY;
    const turretAngle = startTurretAngle;
    let tankDirection = startTankDirection;
    let healthCount = startHealth;

    this.game = game;
    this.player = player;
    this.alive = true;

    // tank body
    if (x < gameWidth / 2) {
        this.tankBody = this.game.add.sprite(x, y, 'tankBody_Enemy_right');
    } else {
        this.tankBody = this.game.add.sprite(x, y, 'tankBody_Enemy_left');
    }
    this.game.physics.arcade.enable(this.tankBody);
    this.tankBody.scale.setTo(0.3, 0.3);
    this.tankBody.body.bounce.y = 0.3;
    this.tankBody.body.gravity.y = 1000;
    this.tankBody.body.collideWorldBounds = true;
    // tank turret
    this.tankTurret = this.tankBody.addChild(this.game.make.sprite(120, 10, 'tankTurret_Enemy'));
    // health
    this.healthCount = healthCount;
    this.healthIndicator = this.tankBody.addChild(this.game.make.text(50, -100,
        this.healthCount + '%', { font: "40px Century Gothic", fill: "#ffffff" }));

    this.lastPosition = {
        x: this.tankBody.x,
        y: this.tankBody.y,
        turretAngle: turretAngle,
        tankDirection: tankDirection,
    };
};

RemotePlayer.prototype.update = function () {
    this.lastPosition.x = this.player.x;
    this.lastPosition.y = this.player.y;
    this.lastPosition.angle = this.player.angle;
    this.tankDirection = this.player.tankDirection;
    this.healthCount = this.player.healthCount;
};

window.RemotePlayer = RemotePlayer;
