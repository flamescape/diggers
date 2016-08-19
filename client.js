global.CLIENT = true;
global.SERVER = false;

var game = require('./game/phasergame');
game.state.add('digging', require('./game/states/digging'), true);
