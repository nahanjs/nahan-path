'use strict';

const PathFull = require('./path_full');
const PathChop = require('./path_chop');

module.exports = Path;

Path.PathFull = PathFull;
Path.PathChop = PathChop;

function Path(pattern, mode = 'chop') {

    let path;

    switch (mode) {
        case 'full':
        case 'f':
            path = PathFull(pattern);
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
