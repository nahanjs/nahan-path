'use strict';


const PathMatch = require('./path_match');
const PathEater = require('./path_eater');

module.exports = Path;

Path.PathMatch = PathMatch;
Path.PathEater = PathEater;

function Path(pattern, mode = 'eater') {

    let path;

    switch (mode) {
        case 'match':
            path = PathMatch(pattern);
            break;
        case 'eater':
            path = PathEater(pattern);
            break;
        default:
            throw new TypeError('Invalid mode');
    }

    return path;
}
