require('./DiggersPhysics');

var game = new Phaser.Game(1280, 800, Phaser.CANVAS);
// game.time.desiredFps = 30;
// game.time.advancedTiming = true;

module.exports = game;

game.state.add('digging', require('./states/digging'), true);
