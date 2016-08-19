
var DiggersTerrain = require('../DiggersTerrain');
var DiggersPhysicsBody = require('../DiggersPhysicsBody');
var game = require('../');

var state = {};

state.preload = function() {
    game.load.spritesheet("gblock", "/img/gblock.png", 48, 48);
    game.load.image("gback", "/img/gback.png");
    game.load.json("map", "/maps/1.json");
}

var terrain, dummy, keys, tileSize;

state.create = function() {

    game.physics.startSystem(Phaser.Physics.DIGGERS);

    game.add.image(0,0,'gback')

    let map = game.cache.getJSON("map");
    terrain = new DiggersTerrain(map, game);
    terrain.createSprites();

    tileSize = map.tilewidth;

    dummy = game.add.sprite(tileSize*5, tileSize*2);
    dummy.width = tileSize*0.25;
    dummy.height = (tileSize/8)*6;
    game.physics.enable(dummy, Phaser.Physics.DIGGERS);

    keys = game.input.keyboard.createCursorKeys();
}

state.update = function() {
    this.game.physics.diggers.separateTerrainFromBody(terrain, dummy.body, true);

    if (keys.right.isDown) {
        dummy.body.velocity.x = 2;
    } else if (keys.left.isDown) {
        dummy.body.velocity.x = -2;
    }

    if (keys.up.isDown && dummy.body.touching.down) {
        dummy.body.velocity.y = -8.8;
    }

    this.game.physics.diggers.separateTerrainFromBody(terrain, dummy.body);
}


const dummyColor = 'rgba(255,255,255,0.5)';
state.render = function(){
    terrain.debugRender();
    dummy.body.render(dummyColor, true);
}

state.preRender = function(){

}

module.exports = state;
