var DiggersPhysics = require('./DiggersPhysics');

class TerrainTouchSensor {
    constructor(body) {
        this.body = body;
        this.precision = 1;
    }

    test(aabb) {
        if (!this.body.nearbyTerrainTiles) return false;
        return this.body.nearbyTerrainTiles.find(t => t.intersects(aabb)) || false;
    }

    get top() {
        return this.test({
            top: this.body.top - this.precision,
            bottom: this.body.top,
            left: this.body.left,
            right: this.body.right
        });
    }
    get bottom() {
        return this.test({
            top: this.body.bottom,
            bottom: this.body.bottom + this.precision,
            left: this.body.left,
            right: this.body.right
        });
    }
    get left() {
        return this.test({
            top: this.body.top,
            bottom: this.body.bottom,
            left: this.body.left - this.precision,
            right: this.body.left
        });
    }
    get right() {
        return this.test({
            top: this.body.top,
            bottom: this.body.bottom,
            left: this.body.right,
            right: this.body.right + this.precision
        });
    }
    get any() {
        return this.test({
            top: this.body.top,
            bottom: this.body.bottom,
            left: this.body.left - this.precision,
            right: this.body.right + this.precision
        }) || this.test({
            top: this.body.top - this.precision,
            bottom: this.body.bottom + this.precision,
            left: this.body.left,
            right: this.body.right
        });
    }

    copyInto(obj) {
        obj.top = this.top;
        obj.bottom = this.bottom;
        obj.left = this.left;
        obj.right = this.right;
        obj.any = this.any;
        return obj;
    }
}

class TerrainOverlapSensor {
    constructor(body) {
        this.body = body;
        this.precision = 0.001;
    }

    get x() {
        if (!this.body.nearbyTerrainTiles) return 0;
        const dx = this.body.deltaX();
        const mm = dx >= 0 ? Math.max : Math.min;
        return this.body.nearbyTerrainTiles.reduce((ov, t) => mm(ov, t.overlapX(this.body, dx)), 0);
    }
    get y() {
        if (!this.body.nearbyTerrainTiles) return 0;
        const dy = this.body.deltaY();
        const mm = dy >= 0 ? Math.max : Math.min;
        return this.body.nearbyTerrainTiles.reduce((ov, t) => mm(ov, t.overlapY(this.body, dy)), 0);
    }
    get any() {
        return this.x || this.y;
    }
}

class DiggersPhysicsBody {
    constructor(sprite) {
        this.sprite = sprite;
        this.game = sprite.game;

        this.type = Phaser.Physics.DIGGERS;
        this.width = sprite.width;
        this.height = sprite.height;

        this.position = new Phaser.Point(sprite.x, sprite.y);
        this.velocity = new Phaser.Point();
        this.touching = new TerrainTouchSensor(this);
        this.overlap = new TerrainOverlapSensor(this);

        this.prevPosition = new Phaser.Point(this.position.x, this.position.y);
        this.prevVelocity = new Phaser.Point();
        this.prevTouching = this.touching.copyInto({});

        this.gravity = 0.5;
        this.stepHeight = 48/3;
    }

    setCollisionTerrain(terrain) {
        this.terrain = terrain;
    }

    destroy() {
        this.sprite.body = null;
        this.sprite = null;
    }

    get top() { return this.position.y; }
    get bottom() { return this.position.y + this.height; }
    get left() { return this.position.x; }
    get right() { return this.position.x + this.width; }

    preUpdate() {
        this.nearbyTerrainTiles = this.terrain.getTilesNear(this.position, 2);

        // if moving left/right
        if (this.velocity.x != 0) {
            // apply velocity
            this.position.x += this.velocity.x;

            // steps/slopes logic...
            if (this.overlap.any !== 0 && this.touching.bottom) {
                const oy = this.overlap.y;
                if (oy <= this.stepHeight) {
                    // try stepping up a step
                    this.position.y -= oy;
                    if (this.overlap.any !== 0) {
                        // if still colliding, revert the step-up attempt
                        this.position.y += oy;
                    }
                }
            }

            // if step up succeeded, then we won't be colliding with anything

            if (this.overlap.any !== 0) {
                // must be a wall too high to step up
                // or maybe we bumped into a wall while jumping/falling

                // let's move out of the wall
                this.position.x -= this.overlap.x;

                // killing the horizontal velocity here would make sense, but it's a matter of preference
                // makes it harder to get into side-tunnels when falling down a shaft
                // this.velocity.x = 0;
            }
        }


        // we'll always be moving down because of gravity
        this.velocity.y += this.gravity;

        if (this.velocity.y > 0 && this.touching.bottom) {
            // if we're touching the floor, then falling is impossible
            // so we reset the velocity
            this.velocity.y = 0
        }

        if (this.velocity.y >= 0 && !this.touching.bottom && this.prevTouching.bottom) {
            // we've begun falling...
            // we may have just stepped down a step (or we could be falling off a cliff)
            this.position.y += this.stepHeight;
            if (this.touching.bottom) {
                console.log('touching!');
                // yes! we're back on the floor again
                // if we're inside the floor, let's just get out of that...
                if (this.overlap.y !== 0) {
                    this.position.y -= this.overlap.y;
                }
            } else {
                // revert the step-down (it was never meant to be)
                // we must be falling farther than just a step
                this.position.y -= this.stepHeight;
            }
        }

        // apply velocity to current position
        this.position.y += this.velocity.y;

        if (this.overlap.y !== 0) {
            // if we hit our head or landed through the floor..
            // let's move out of the floor/ceiling
            this.position.y -= this.overlap.y;

            // and kill the velocity
            this.velocity.y = 0;
        }
    }

    deltaY() {
        return this.position.y - this.prevPosition.y;
    }
    deltaX() {
        return this.position.x - this.prevPosition.x;
    }

    postUpdate() {
        // take note of previous values
        // things may have changed during update()
        this.prevPosition.x = this.position.x;
        this.prevPosition.y = this.position.y;
        this.prevVelocity.x = this.velocity.x;
        this.prevVelocity.y = this.velocity.y;
        this.touching.copyInto(this.prevTouching);

        // set sprite position in anticipation of render()
        // no half-pixels!
        this.sprite.position.x = this.position.x << 0;
        this.sprite.position.y = this.position.y << 0;
    }

    render(color = 'rgba(255,0,0,0.7)', filled = false) {
        let ctx = this.game.context;

        ctx.fillStyle = color;
        ctx.strokeStyle = color;

        if (this.isCircle) {
            ctx.beginPath();
            ctx.arc(this.center.x - this.game.camera.x, this.center.y - this.game.camera.y, this.radius, 0, 2 * Math.PI);

            if (filled) {
                ctx.fill();
            } else {
                ctx.stroke();
            }
        } else {
            if (filled) {
                ctx.fillRect(this.position.x - this.game.camera.x, this.position.y - this.game.camera.y, this.width, this.height);
            } else {
                ctx.strokeRect(this.position.x - this.game.camera.x, this.position.y - this.game.camera.y, this.width, this.height);
            }
        }
    }

    intersectsTile(tile) {

    }

    intersects(body) {
        return !(this.right<<0 <= body.left<<0
            || this.bottom<<0 <= body.top<<0
            || this.left<<0 >= body.right<<0
            || this.top<<0 >= body.bottom<<0);
    }

    intersectsAny(bodies) {
        return !!bodies.find(b => this.intersects(b));
    }

    overlapY(body, gravityPass = false) {
        let dy = this.deltaY();

        if (!this.intersects(body)) {
            // not intersecting
            return 0;
        }

        if (dy >= 0) {
            // we're falling into the body
            return this.bottom - body.position.y;
        } else {
            // we're jumping up into the body
            return this.position.y - body.bottom;
        }
    }

    overlapX(body) {
        let dx = this.deltaX();

        if (!this.intersects(body)) {
            // not intersecting
            return 0;
        }

        if (dx > 0) {
            // we're moving right into the body
            return this.right - body.left;
        } else {
            // we're moving left into the body
            return this.left - body.right;
        }
    }

    overlapAllY(bodies, gravityPass) {
        let mm = this.deltaY() >= 0 ? Math.max : Math.min;
        return bodies.reduce((overlap, body) => mm(overlap, this.overlapY(body, gravityPass)), 0);
    }

    overlapAllX(bodies) {
        let mm = this.deltaX() >= 0 ? Math.max : Math.min;
        return bodies.reduce((overlap, body) => mm(overlap, this.overlapX(body)), 0);
    }
}

module.exports = DiggersPhysicsBody;
