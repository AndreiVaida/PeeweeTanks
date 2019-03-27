const RemotePlayer = function (index, game, player, startX, startY, startTurretAngle) {
    const x = startX;
    const y = startY;
    const turretAngle = startTurretAngle;

    this.game = game;
    this.health = 100;
    this.player = player;
    this.alive = true;

    // tank body
    this.tankBody = this.game.add.sprite(x, y, 'tankBody');
    this.game.physics.arcade.enable(this.tankBody);
    this.tankBody.scale.setTo(0.3, 0.3);
    this.tankBody.body.bounce.y = 0.3;
    this.tankBody.body.gravity.y = 1000;
    this.tankBody.body.collideWorldBounds = true;
    // tank turret
    this.tankTurret = this.tankBody.addChild(this.game.make.sprite(120, 10, 'tankTurret'));

    this.lastPosition = {
        x: this.tankBody.x,
        y: this.tankBody.y,
        turretAngle: turretAngle,
    };
};

RemotePlayer.prototype.update = function () {
    this.lastPosition.x = this.player.x;
    this.lastPosition.y = this.player.y;
    this.lastPosition.angle = this.player.angle;
};

window.RemotePlayer = RemotePlayer;
