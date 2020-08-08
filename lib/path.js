'use strict';

const PathFull = require('./path_full');
const PathRest = require('./path_rest');
const PathChop = require('./path_chop');

function Path(pattern, mode = 'full') {

    let path;

    switch (mode) {
        case 'full':
        case 'f':
            path = PathFull(pattern);
            break;
        case 'rest':
        case 'r':
            path = PathRest(pattern);
            break;
        case 'chop':
        case 'c':
            path = PathChop(pattern);
            break;
        default:
            throw new TypeError('Invalid mode');
    }

    return path;
}

Path.PathFull = PathFull;
Path.PathRest = PathRest;
Path.PathChop = PathChop;

module.exports = Path;
