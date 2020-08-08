'use strict';

const { isRegExp, isString } = require('./util');
const { pathToRegexp } = require("path-to-regexp");

function PathChop(pattern) {

    if (isString(pattern))
        pattern = pathToRegexp(pattern, [], { end: false });

    if (!isRegExp(pattern))
        throw new TypeError('Invalid pattern');

    function path(ctx, next) {

        const str = ctx.path.rest;
        const res = pattern.exec(str);

        if (res === null) return;
        if (res.index !== 0) return;

        let flag = false;
        const mat = res[0];
        if (mat[mat.length - 1] === '/') {
            ctx.path.chop += str.substr(0, mat.length - 1);
            ctx.path.rest = str.substr(mat.length - 1);
            flag = true;
        } else if (str.length === mat.length) {
            ctx.path.chop = ctx.path.full;
            ctx.path.rest = '/';
            flag = true;
        } else if (str[mat.length] === '/') {
            ctx.path.chop += str.substr(0, mat.length);
            ctx.path.rest = str.substr(mat.length);
            flag = true;
        }

        if (flag === false) return;

        ctx.path.match.push(res);
        return next(res);
    }

    return path;
}

module.exports = PathChop;
