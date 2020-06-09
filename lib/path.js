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
        case 'm':
            path = PathMatch(pattern);
            break;
        case 'eater':
        case 'e':
            path = PathEater(pattern);
            break;
        default:
            throw new TypeError('Invalid mode');
    }

    return path;
}
