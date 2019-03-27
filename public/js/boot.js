var boot = function () {
  console.log('boot');
};

var gameWidth = 1280;
var gameHeight = 720;

boot.prototype = {
  preload: function () {
    console.log('boot - preload', this);
  },
  create: function () {
    console.log('boot - create');
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.scale.pageAlignHorizontally = true;
    this.game.state.start('HomePage');
    this.stage.disableVisibilityChange = true
  }
};
