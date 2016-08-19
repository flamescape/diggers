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
        if (object.parent && object.parent instanceof Phaser.Group) {
            object.parent.addToHash(object);
        }
    }

    collideTerrain(mobile, terrain, stepUpHeight, gravityPass = false) {
        let tiles = terrain.getTileBodiesNear(mobile.position);

        this.separateTerrainY(mobile.body, tiles, stepUpHeight, gravityPass);
        this.separateTerrainX(mobile.body, tiles);
    }

    separateTerrainY(mobile, tiles, stepUpHeight, gravityPass) {
        if (!mobile.enable || !mobile.intersectsAny(tiles)) {
            return false;
        }

        var overlap = mobile.overlapAllY(tiles, gravityPass);

        if (Math.abs(overlap) < stepUpHeight) {
            mobile.position.y -= overlap;
            if (mobile.intersectsAny(tiles)) {
                // if we're still intersecting, revert back to previous y
                mobile.position.y = mobile.prev.y;
            }
        }
    }

    separateTerrainX(mobile, tiles) {
        if (!mobile.enable || !mobile.intersectsAny(tiles)) {
            return false;
        }

        var overlap = mobile.overlapAllX(tiles);

        if (Math.abs(overlap) < 120) {
            mobile.position.x -= overlap;
            if (mobile.intersectsAny(tiles)) {
                // if we're still intersecting, revert back to previous x
                mobile.position.x = mobile.prev.x;
            }
        }
    }


}

Phaser.Physics.Diggers = DiggersPhysics;
