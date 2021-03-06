
var DiggersTerrain = require('../DiggersTerrain');
var DiggersPhysicsBody = require('../DiggersPhysicsBody');
var game = require('../');

var state = {};

state.preload = function() {
    game.load.spritesheet("gblock", "/img/gblock.png", 48, 48);
    game.load.image("dummy", "/img/dummy.png");
    game.load.image("gback", "/img/gback.png");
    game.load.json("map", "/maps/1.json");
}

var terrain, dummy, keys, tileSize;

state.create = function() {

    game.physics.startSystem(Phaser.Physics.DIGGERS);

    game.add.image(0,0,'gback')

    let map = game.cache.getJSON("map");
    game.world.setBounds(0, 0, map.width * map.tileWidth, map.height * map.tileheight);
    terrain = new DiggersTerrain(map, game);
    terrain.createSprites();

    tileSize = map.tilewidth;

    dummy = game.add.sprite(tileSize*5, tileSize*2, "dummy");
    dummy.width = tileSize*0.25;
    dummy.height = (tileSize/8)*6;
    game.physics.enable(dummy, Phaser.Physics.DIGGERS);
    dummy.body.setCollisionTerrain(terrain);

    game.camera.follow(dummy, Phaser.Camera.FOLLOW_PLATFORMER, 0.1, 0.1);
    game.camera.setBoundsToWorld();

    keys = game.input.keyboard.createCursorKeys();
}

state.update = function() {

    if (keys.right.isDown) {
        dummy.body.velocity.x = 2;
    } else if (keys.left.isDown) {
        dummy.body.velocity.x = -2;
    }

    if (keys.up.isDown && dummy.body.touching.bottom) {
        dummy.body.velocity.y = -8;
    }

}


const dummyColor = 'rgba(255,255,255,0.5)';
state.render = function(){
    if (keys.down.isDown) {
        terrain.debugRender();
    }
    // dummy.body.render(dummyColor);
}

state.preRender = function(){

}

module.exports = state;
