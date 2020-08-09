'use strict';

const { isRegExp, isString } = require('./util');
const { pathToRegexp } = require("path-to-regexp");

function PathRest(pattern) {

    if (isString(pattern))
        pattern = pathToRegexp(pattern);

    if (!isRegExp(pattern))
        throw new TypeError('Invalid pattern');

    function path(ctx, next) {

        ctx = ctx.nh || ctx;
        const str = ctx.path.rest;
        const res = pattern.exec(str);

        if (res === null) return;
        if (res.index !== 0) return;
        if (res[0].length !== str.length) return;

        ctx.path.match.push(res);
        return next(res);
    }

    return path;
}

module.exports = PathRest;
