class HomePage {
    constructor() {
        console.log('HomePage - constructor');
        this.menuSound = null;
    }

    preload() {
        this.game.load.image('homeBackground', 'assets/LowPolyMountain.jpg');
        this.game.load.image('playButton', 'assets/PlayButtonBlue.png');
        this.game.load.audio('menuSound', 'assets/04._Ruined-Himmelsdorf.mp3');
    }

    create() {
        console.log('HomePage - create');
        var homeBackground = this.game.add.sprite(0, 0, "homeBackground");
        var playButton = this.game.add.button(gameWidth/2, gameHeight/2, "playButton", this.playTheGame, this);
        playButton.anchor.setTo(0.5, 0.5);

        this.menuSound = this.game.sound.add("menuSound");
        this.menuSound.volume = 0.4;
        this.menuSound.loop = true;
        this.menuSound.play();
    }

    playTheGame() {
        this.menuSound.stop();
        this.game.state.start("TheGame");
    }

}
