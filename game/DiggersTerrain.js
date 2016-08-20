
class DiggersTerrainTile {
    constructor(params) {
        for (let x in params) {
            this[x] = params[x];
        }
        this.tw = this.size/4;
        this.th = this.size/8;
    }

    get worldX() { return this.x * this.size; }
    get worldY() { return this.y * this.size; }
    get top() { return this.worldY; }
    get left() { return this.worldX; }
    get bottom() { return this.worldY + this.size; }
    get right() { return this.worldX + this.size; }

    intersects(aabb) {
        if (this.type.mask === DiggersTerrain.MASK_EMPTY) {
            return false;
        }

        if (this.type.mask === DiggersTerrain.MASK_SOLID) {
            return !(this.right <= aabb.left<<0
                || this.bottom <= aabb.top<<0
                || this.left >= aabb.right<<0
                || this.top >= aabb.bottom<<0);
        }

        // and now for any arbitrary tile mask...
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 4; x++) {
                if (Math.pow(2, (y*4)+x) & this.type.mask) {
                    const top = this.top + (y * this.th);
                    const bottom = top + this.th;
                    const left = this.left + (x * this.tw);
                    const right = left + this.tw;

                    const collision = !(right <= aabb.left<<0
                        || bottom <= aabb.top<<0
                        || left >= aabb.right<<0
                        || top >= aabb.bottom<<0);

                    if (collision) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    overlapY(aabb, dy = 0) {
        if (this.type.mask === DiggersTerrain.MASK_EMPTY) {
            return 0;
        }

        if (!this.intersects(aabb)) {
            return 0;
        }

        if (this.type.mask === DiggersTerrain.MASK_SOLID) {
            if (dy >= 0) {
                return aabb.bottom - this.top;
            } else {
                return aabb.top - this.bottom;
            }
        }

        // arbitrary tile mask
        let overlap = 0;

        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 4; x++) {
                if (Math.pow(2, (y*4)+x) & this.type.mask) {
                    const top = this.top + (y * this.th);
                    const bottom = top + this.th;
                    const left = this.left + (x * this.tw);
                    const right = left + this.tw;

                    const collision = !(right <= aabb.left<<0
                        || bottom <= aabb.top<<0
                        || left >= aabb.right<<0
                        || top >= aabb.bottom<<0);

                    if (!collision) {
                        continue;
                    }

                    if (dy >= 0) {
                        overlap = Math.max(overlap, aabb.bottom - top);
                    } else {
                        overlap = Math.min(overlap, aabb.top - bottom);
                    }
                }
            }
        }

        return overlap;
    }

    overlapX(aabb, dx = 0) {
        if (this.type.mask === DiggersTerrain.MASK_EMPTY) {
            return 0;
        }

        if (!this.intersects(aabb)) {
            return 0;
        }

        if (this.type.mask === DiggersTerrain.MASK_SOLID) {
            if (dx >= 0) {
                return aabb.right - this.left;
            } else {
                return aabb.left - this.right;
            }
        }

        // arbitrary tile mask
        let overlap = 0;

        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 4; x++) {
                if (Math.pow(2, (y*4)+x) & this.type.mask) {
                    const top = this.top + (y * this.th);
                    const bottom = top + this.th;
                    const left = this.left + (x * this.tw);
                    const right = left + this.tw;

                    const collision = !(right <= aabb.left<<0
                        || bottom <= aabb.top<<0
                        || left >= aabb.right<<0
                        || top >= aabb.bottom<<0);

                    if (!collision) {
                        continue;
                    }

                    if (dx >= 0) {
                        overlap = Math.max(overlap, aabb.right - left);
                    } else {
                        overlap = Math.min(overlap, aabb.left - right);
                    }
                }
            }
        }

        return overlap;
    }
}

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

        this.tileTypes = this.tilesets.reduce((tiles, ts) => {
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

        this.tiles = this.foregroundLayer.data.reduce((tiles, tile, idx) => {
            tiles.push(new DiggersTerrainTile({
                idx  : idx,
                type : this.tileTypes[tile],
                size : this.tileSize,
                x    : idx % this.width,
                y    : (idx / this.width) << 0,
            }));
            return tiles;
        }, []);
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

                let tile = this.tileTypes[cell];

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

    getTileAt(x, y) {
        return this.tiles[(y * this.width) + x];
    }

    getTilesNear(pos, range = 1) {
        const x = (pos.x / this.tileSize) << 0;
        const y = (pos.y / this.tileSize) << 0;
        let tiles = [];
        for (let i = -range; i <= range; i++) {
            for (let j = -range; j <= range; j++) {
                let tile = this.getTileAt(x + i, y + j);
                if (tile && tile.type.idx > 0) {
                    tiles.push(tile);
                }
            }
        }
        return tiles;
    }

    debugRenderCell(x,y,cell) {
        const tile = this.tileTypes[cell];

        if (!tile || tile.mask === DiggersTerrain.MASK_EMPTY) {
            return;
        }

        let colour = 'rgba(255,0,0,0.7)';
        if (tile.diggable) {
            colour = 'rgba(0,255,0,0.5)';
        } else if (tile.water) {
            colour = 'rgba(0,0,255,0.5)';
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

        // ctx.fillRect(px, py, this.tileSize, this.tileSize);
        // ctx.fillStyle = 'rgba(255,200,0,0.4)';

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
