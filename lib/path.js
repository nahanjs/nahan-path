'use strict';


const PathFull = require('./path_full');
const PathTrunc = require('./path_trunc');

module.exports = Path;

Path.PathFull = PathFull;
Path.PathTrunc = PathTrunc;

function Path(pattern, mode = 'trunc') {

    let path;

    switch (mode) {
        case 'full':
            path = PathFull(pattern);
            break;
        case 'trunc':
            path = PathTrunc(pattern);
            break;
        default:
            throw new TypeError('Invalid mode');
    }

    return path;
}
