require('./DiggersPhysics');

var game = new Phaser.Game(1280, 800, Phaser.CANVAS);
// game.time.desiredFps = 30;

module.exports = game;

game.state.add('digging', require('./states/digging'), true);
