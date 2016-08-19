
class DiggersPhysicsBody {
    constructor(sprite) {
        this.sprite = sprite;
        this.game = sprite.game;

        this.type = Phaser.Physics.DIGGERS;

        this.enable = true;

        this.offset = new Phaser.Point();

        this.position = new Phaser.Point(sprite.x, sprite.y);
        this.prev = new Phaser.Point(this.position.x, this.position.y);

        this.width = sprite.width;
        this.height = sprite.height;
        this.halfWidth = Math.abs(sprite.width / 2);
        this.halfHeight = Math.abs(sprite.height / 2);

        this.center = new Phaser.Point(sprite.x + this.halfWidth, sprite.y + this.halfHeight);
        this.velocity = new Phaser.Point();

        this.gravity = 0.5;

        /**
        * @property {number} facing - A const reference to the direction the Body is traveling or facing.
        * @default
        */
        this.facing = Phaser.NONE;

        /**
        * This object is populated with boolean values when the Body collides with another.
        * touching.up = true means the collision happened to the top of this Body for example.
        * @property {object} touching - An object containing touching results.
        */
        this.touching = { none: true, up: false, down: false, left: false, right: false };

        /**
        * This object is populated with previous touching values from the bodies previous collision.
        * @property {object} wasTouching - An object containing previous touching results.
        */
        this.wasTouching = { none: true, up: false, down: false, left: false, right: false };

        /**
        * This object is populated with boolean values when the Body collides with the World bounds or a Tile.
        * For example if blocked.up is true then the Body cannot move up.
        * @property {object} blocked - An object containing on which faces this Body is blocked from moving, if any.
        */
        this.blocked = { up: false, down: false, left: false, right: false };

        this.dirty = false;
    }

    destroy() {
        this.sprite.body = null;
        this.sprite = null;
    }

    get right() {
        return this.position.x + this.width;
    }
    get bottom() {
        return this.position.y + this.height;
    }

    preUpdate() {
        if (!this.enable || !this.mobile) {
            return;
        }

        this.dirty = true;

        this.prev.x = this.position.x;
        this.prev.y = this.position.y;

        this.position.x = (this.sprite.world.x - (this.sprite.anchor.x * this.sprite.width)) + this.sprite.scale.x * this.offset.x;
        this.position.y = (this.sprite.world.y - (this.sprite.anchor.y * this.sprite.height)) + this.sprite.scale.y * this.offset.y;


        // apply velocity
        if (this.touching.down && this.velocity.y > 0) {
            this.velocity.y = 0;
        }
        if (this.touching.up && this.velocity.y < 0) {
            this.velocity.y = 0;
        }


        // apply gravity
        this.velocity.y += this.gravity;


        // cap vertical velocity
        if (this.velocity.y > 0 && this.velocity.y < 2) this.velocity.y = 2;
        if (this.velocity.y > 4) this.velocity.y = 4;
        if (this.velocity.y < -10) this.velocity.y = -10;

        // apply vertical velocity
        this.position.y += this.velocity.y;
        this.position.x += this.velocity.x;


        this.touching.none = true;
        this.touching.up = false;
        this.touching.down = false;
        this.touching.left = false;
        this.touching.right = false;
    }

    deltaY() {
        return this.position.y - this.prev.y;
    }
    deltaX() {
        return this.position.x - this.prev.x;
    }

    postUpdate() {
        if (!this.enable || !this.dirty || !this.mobile) {
            return;
        }

        this.dirty = false;

        this.sprite.position.x += this.deltaX();
        this.sprite.position.y += this.deltaY();
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

    get x() { return this.position.x; }
    get left() { return this.position.x; }
    get y() { return this.position.y; }
    get top() { return this.position.y; }

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
            if (gravityPass) {
                this.touching.none = false;
                this.touching.down = true;
            }
            return this.bottom - body.position.y;
        } else {
            // we're jumping up into the body
            if (gravityPass) {
                this.touching.none = false;
                this.touching.up = true;
            }
            return this.position.y - body.bottom;
        }
    }

    overlapX(body) {
        let dx = this.deltaX();

        if (!this.intersects(body)) {
            // not intersecting
            return 0;
        }

        this.touching.none = false;
        if (dx > 0) {
            // we're moving right into the body
            this.touching.right = true;
            return this.right - body.left;
        } else {
            // we're moving left into the body
            this.touching.left = true;
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
