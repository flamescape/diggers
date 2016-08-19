var Stage = require('../Stage');


class StageFactory {
    create() {
        var s = new Stage();
        // s.once('close', () => {
        //
        // });
        return s;
    }
}

module.exports = new StageFactory();
