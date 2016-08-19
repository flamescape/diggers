
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

    getTileBodiesIntersecting(body) {
        this.getBigTilesNear({x: body.left, y: body.top}).forEach(tile => this.breakTile(tile));

        return this.getTileBodiesNear({x: body.left, y: body.top}).filter(tile => tile.intersects(body));
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

module.exports = DiggersTerrain;
