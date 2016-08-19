
class DiggersTerrainGroup extends Array {
    constructor(terrain) {
        super();
        this.terrain = terrain;
        function rc() {
            return ((Math.random() * 200) + 50) << 0;
        }
        this.debugColor = `rgba(${rc()}, ${rc()}, ${rc()}, 0.7)`;
    }

    add(sprite) {
        this.push(sprite);
    }
}

var unbreakableTiles = [3,88,90,91,93,94,95,123,124,125,128,129,130,131,132,133,134,143,146,363,364,
64,65,152,153,154,155,156,157,158,159,160,241,242,243,244,309,310,311,312,313,314,315,316,365,366,367,368,369,370,371,372,373,374,
379,380,381,382,383,384,385,386,387,388];

class DiggersTerrain {
    constructor(map, game) {

        this.game = game;

        if (map.tilewidth !== map.tileheight) {
            throw Error("Only square-tiled maps allowed");
        }

        this.tileSize = map.tilewidth;
        this.width = map.width;
        this.height = map.height;

        this.foregroundLayer = map.layers.find(l => l.name === "Foreground");
        this.backgroundLayer = map.layers.find(l => l.name === "Background");
        this.tilesets = map.tilesets;

        this.tiles = this.tilesets.reduce((tiles, ts) => {
            for (let i = 0; i < ts.tilecount; i++) {
                let tiledef = {
                    idx: i,
                    mask: DiggersTerrain.MASK_SOLID,
                    res: ts.name,
                    diggable: false,
                    water: false
                };
                const props = ts.tileproperties[i];
                if (props) {
                    if (props.mask) {
                        tiledef.mask = +props.mask;
                    }
                    if (props.diggable) {
                        tiledef.diggable = !!props.diggable;
                    }
                    if (props.water) {
                        tiledef.water = !!props.water;
                    }
                }
                tiles[ts.firstgid + i] = tiledef;
            }
            return tiles;
        }, [{
            id: 0,
            mask: DiggersTerrain.MASK_EMPTY,
            res: null,
            diggable: false,
            water: false
        }]);

        return;

        for (let y = 0; y < foreground.height; y++) {
            for (let x = 0; x < foreground.width; x++) {
                let cell = foreground.data[(y*foreground.width) + x];
                if (cell <= 1) continue;

                if (tileshapes[cell]) {
                    tileshapes[cell].forEach(part => {
                        terrain.addSmall({
                            x: (TILE_SIZE*x)+(part[0]*(TILE_SIZE/4)),
                            y: (TILE_SIZE*y)+(part[1]*(TILE_SIZE/8)),
                            unbreakable: unbreakableTiles.indexOf(cell) !== -1
                        });
                    });
                } else {
                    terrain.addBig({
                        x: TILE_SIZE*x,
                        y: TILE_SIZE*y,
                        unbreakable: unbreakableTiles.indexOf(cell) !== -1
                    });
                }
            }
        }

        this.tileSize = tileSize;
        this.groupSize = groupSize;
        let wgroups = width / this.groupSize;
        let hgroups = height / this.groupSize;
        this.group = [];
        this.groups = [];
        for (let y = 0; y < hgroups; y++) {
            this.group[y] = [];
            for (let x = 0; x < wgroups; x++) {
                this.group[y][x] = new DiggersTerrainGroup(this);
                this.groups.push(this.group[y][x]);
            }
        }
    }

    createSprites() {
        // creates foreground & background sprites
        // adds them to the game

        this.backgroundSpriteBatch = this.createSpriteBatch(this.backgroundLayer);
        this.foregroundSpriteBatch = this.createSpriteBatch(this.foregroundLayer);
    }

    createSpriteBatch(layer) {
        let spriteBatch = this.game.add.spriteBatch(null);

        for (let y = 0; y < layer.height; y++) {
            for (let x = 0; x < layer.width; x++) {
                let cell = layer.data[(y*this.width) + x];
                if (cell <= 1) continue;

                let tile = this.tiles[cell];

                let spr = this.game.add.image(
                    x * this.tileSize,
                    y * this.tileSize,
                    tile.res,
                    tile.idx
                );

                spriteBatch.add(spr);
            }
        }
    }

    x2gx(x) {
        return (x / this.tileSize / this.groupSize) << 0;
    }
    y2gy(y) {
        return (y / this.tileSize / this.groupSize) << 0;
    }

    add(sprite) {
        const x = this.x2gx(sprite.x);
        const y = this.y2gy(sprite.y);
        this.group[y][x].add(sprite);
        this.game.physics.enable(sprite, Phaser.Physics.DIGGERS);
        this.push(sprite);
        return sprite;
    }

    remove(sprite) {
        const x = this.x2gx(sprite.x);
        const y = this.y2gy(sprite.y);
        const idx = this.group[y][x].indexOf(sprite);
        if (idx === -1) return false;
        this.group[y][x].splice(idx, 1);
        sprite.destroy();
        return true;
    }

    addSmall(tile) {
        let s = this.game.add.sprite(tile.x, tile.y);
        s.width = this.tileSize/4;
        s.height = this.tileSize/8;
        s.data.unbreakable = !!tile.unbreakable;
        this.add(s);
        return s;
    }

    addBig(tile) {
        let s = this.game.add.sprite(tile.x, tile.y);
        s.width = this.tileSize;
        s.height = this.tileSize;
        s.data.big = true;
        s.data.unbreakable = !!tile.unbreakable;
        this.add(s);
        return s;
    }

    breakTile(tile) {
        let newTiles = [];
        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 8; y++) {
                newTiles.push(this.addSmall({
                    x: tile.x + (x/4)*this.tileSize,
                    y: tile.y + (y/8)*this.tileSize,
                    unbreakable: !!tile.data.unbreakable
                }));
            }
        }
        this.remove(tile);
        return newTiles;
    }

    getTileBodiesIntersecting(body) {
        this.getBigTilesNear({x: body.left, y: body.top}).forEach(tile => this.breakTile(tile));

        return this.getTileBodiesNear({x: body.left, y: body.top}).filter(tile => tile.intersects(body));

        // .reduce((tiles, tile) => {
        //     if (tile.data.big) {
        //         let newTiles = this.breakTile(tile);
        //         tiles.push(...newTiles);
        //     } else {
        //         tiles.push(tile);
        //     }
        //     return tiles;
        // }, []).filter(tile =>
        //     tile.body.intersects(body)
        // );
    }

    getTilesInGroup(x, y) {
        if (!this.group[y] || !this.group[y][x]) {
            return [];
        }

        return this.group[y][x];
    }

    getBigTilesNear(pos) {
        return this.getTilesNear(pos).filter(t => !!t.data.big);
    }

    getTilesNear(pos) {
        const x = this.x2gx(pos.x);
        const y = this.y2gy(pos.y);
        let tiles = [];
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                let gtiles = this.getTilesInGroup(x + i, y + j);
                tiles.push(...gtiles);
            }
        }
        return tiles;
    }

    getTileBodiesNear(pos) {
        return this.getTilesNear(pos).map(t => t.body);
    }

    debugRenderCell(x,y,cell) {
        const tile = this.tiles[cell];

        if (!tile || tile.mask === DiggersTerrain.MASK_EMPTY) {
            return;
        }

        let colour = 'rgba(255,0,0,0.7)';
        if (tile.diggable) {
            colour = 'rgba(0,255,0,0.8)';
        } else if (tile.water) {
            colour = 'rgba(0,0,255,0.8)';
        }

        const ctx = this.game.context;

        ctx.fillStyle = colour;
        ctx.strokeStyle = colour;

        const px = (x - this.game.camera.x) * this.tileSize;
        const py = (y - this.game.camera.y) * this.tileSize;

        if (tile.mask === DiggersTerrain.MASK_SOLID) {
            ctx.fillRect(px, py, this.tileSize, this.tileSize);
            return;
        }

        const tw = this.tileSize / 4;
        const th = this.tileSize / 8;

        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 4; x++) {
                if (Math.pow(2, (y*4)+x) & tile.mask) {
                    ctx.fillRect(px + (tw*x), py + (th*y), tw, th);
                }
            }
        }
    }

    debugRender() {
        let layer = this.foregroundLayer;

        for (let y = 0; y < layer.height; y++) {
            for (let x = 0; x < layer.width; x++) {
                let cell = layer.data[(y*this.width) + x];
                if (cell <= 1) continue;

                this.debugRenderCell(x,y,cell);
            }
        }
    }
}
DiggersTerrain.MASK_SOLID = 4294917119;
DiggersTerrain.MASK_EMPTY = 0;

DiggersTerrain.DEBUG_BREAKABLE = Symbol("DEBUG_BREAKABLE");
DiggersTerrain.DEBUG_GROUPS = Symbol("DEBUG_GROUPS");

module.exports = DiggersTerrain;
