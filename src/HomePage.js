class HomePage {
    constructor() {
        console.log('HomePage - constructor');
    }

    preload() {
        this.game.load.image('homeBackground', 'images/LowPolyMountain.jpg');
        this.game.load.image('playButton', 'images/PlayButtonBlue.png');
    }

    create() {
        console.log('HomePage - create');
        var homeBackground = this.game.add.sprite(0, 0, "homeBackground");
        var playButton = this.game.add.button(gameWidth/2, gameHeight/2, "playButton", this.playTheGame, this);
        playButton.anchor.setTo(0.5, 0.5);
    }

    playTheGame() {
        this.game.state.start("TheGame");
    }

}
