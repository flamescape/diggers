var EventEmitter = require('eventemitter2');

const TICK_RATE = 1000/60;

class Stage extends EventEmitter {
    Start() {
        this.emit('started');
        this.lastUpdate = Date.now();
        this.delta = 0;
        this.stopping = false;
        this.Loop();
    }

    Stop() {
        this.stopping = true;
    }

    Loop() {
        if (this.stopping) {
            this.emit('stopped');
            return;
        }

        this.now = Date.now();
        this.delta += this.now - this.lastUpdate;
        this.lastUpdate = this.now;

        if (this.delta >= TICK_RATE) {

            this.ProcessInput();

            while (this.delta >= TICK_RATE) {
                this.delta -= TICK_RATE;
                this.UpdatePhysics();
            }
            this.lastUpdate -= this.delta;

            this.Dispatch();
        }

        process.nextTick(() => this.Loop());
    }

    ProcessInput() {

    }

    UpdatePhysics() {
        // run a single physics iteration
    }

    Dispatch() {
        // emit events queued up
    }

}

module.exports = Stage;
