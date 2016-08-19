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

    separateTerrainFromBody(terrain, body, gravityPass = false) {
        const stepUpHeight = terrain.tileSize / 3;
        const tiles = terrain.getTilesNear(body.position);

        this.separateTerrainY(body, tiles, stepUpHeight, gravityPass);
        this.separateTerrainX(body, tiles);
    }

    intersectsTile(body, tile) {
        return !(tile.right <= body.left<<0
            || tile.bottom <= body.top<<0
            || tile.left >= body.right<<0
            || tile.top >= body.bottom<<0);
    }
    intersectsAnyTile(body, tiles) {
        return tiles.find(t => this.intersectsTile(body, t));
    }

    overlapTileY(body, tile, gravityPass = false) {
        const dy = body.deltaY();

        if (!this.intersectsTile(body, tile)) {
            // not intersecting
            return 0;
        }

        if (dy >= 0) {
            // we're falling into the body
            if (gravityPass) {
                body.touching.none = false;
                body.touching.down = true;
            }
            return body.bottom - tile.top;
        } else {
            // we're jumping up into the body
            if (gravityPass) {
                body.touching.none = false;
                body.touching.up = true;
            }
            return body.position.y - tile.bottom;
        }
    }
    overlapTilesY(body, tiles, gravityPass = false) {
        let mm = body.deltaY() >= 0 ? Math.max : Math.min;
        return tiles.reduce((overlap, tile) => mm(overlap, this.overlapTileY(body, tile, gravityPass)), 0);
    }

    separateTerrainY(body, tiles, stepUpHeight, gravityPass) {
        if (!this.intersectsAnyTile(body, tiles)) {
            return false;
        }

        var overlap = this.overlapTilesY(body, tiles, gravityPass);

        if (Math.abs(overlap) < stepUpHeight) {
            body.position.y -= overlap;
            if (this.intersectsAnyTile(body, tiles)) {
                // if we're still intersecting, revert back to previous y
                body.position.y = body.prev.y;
            }
        }

    }

    separateTerrainX(body, tiles) {
        if (!this.intersectsAnyTile(body, tiles)) {
            return false;
        }

        // var overlap = this.overlapTilesX(body, tiles, gravityPass);
        //
        // if (Math.abs(overlap) < stepUpHeight) {
        //     body.position.y -= overlap;
        // }

        if (this.intersectsAnyTile(body, tiles)) {
            // if we're still intersecting, revert back to previous x
            body.position.x = body.prev.x;
        }
    }

    // separateTerrainX(mobile, tiles) {
    //     if (!mobile.enable || !mobile.intersectsAny(tiles)) {
    //         return false;
    //     }
    //
    //     var overlap = mobile.overlapAllX(tiles);
    //
    //     // if (Math.abs(overlap) < 120) {
    //         mobile.position.x -= overlap;
    //         if (mobile.intersectsAny(tiles)) {
    //             // if we're still intersecting, revert back to previous x
    //             mobile.position.x = mobile.prev.x;
    //         }
    //     // }
    // }


}

Phaser.Physics.Diggers = DiggersPhysics;
