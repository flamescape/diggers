var DiggersTerrain = require('./DiggersTerrain');
var DiggersPhysicsBody = require('./DiggersPhysicsBody');


// add the DIGGERS Physics system to Phaser

Phaser.Physics.DIGGERS = Symbol('DIGGERS');

let oldStartSystem = Phaser.Physics.prototype.startSystem;
Phaser.Physics.prototype.startSystem = function(system){
    if (system === Phaser.Physics.DIGGERS) {
        this.diggers = new Phaser.Physics.Diggers(this.game, this.config);
    } else {
        return oldStartSystem.apply(this, arguments);
    }
}

let oldEnable = Phaser.Physics.prototype.enable;
Phaser.Physics.prototype.enable = function(object, system){
    if (system === Phaser.Physics.DIGGERS) {
        this.diggers.enable(object)
    } else {
        return oldEnable.apply(this, arguments);
    }
}

let oldDestroy = Phaser.Physics.prototype.destroy;
Phaser.Physics.prototype.destroy = function(object, system){
    this.diggers = null;
    return oldDestroy.apply(this, arguments);
}

// Define the DiggersPhysics system

class DiggersPhysics {
    constructor(game, config){
        this.game = game;
        this.config = config;
        this.gravity = new Phaser.Point(0,0);
    }

    enable(object) {
        if (Array.isArray(object)) {
            return object.forEach(o => this.enable(o));
        }

        object.body = new DiggersPhysicsBody(object);
    }
}

Phaser.Physics.Diggers = DiggersPhysics;
