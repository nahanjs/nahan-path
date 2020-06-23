'use strict';

const { init_path, isRegExp, isString } = require('./utils');

module.exports = PathFull;

function PathFull(pattern) {

    let path;

    if (isRegExp(pattern)) {
        path = PathFullRegExp(pattern);
    } else if (isString(pattern)) {
        path = PathFullString(pattern)
    } else {
        throw new TypeError('Type of "pattern" should be "string", "String" or "RegExp"');
    }

    return path;
}

function PathFullRegExp(pattern) {

    pattern = ((pat) => {
        let source = pat.source;
        if (source[0] !== '^') source = '^' + source;
        if (source[source.length - 1] !== '$') source += '$';

        let flags = '';
        if (pat.ignoreCase) flags += 'i';

        return new RegExp(source, flags);
    })(pattern);

    return async function (ctx, next) {
        init_path(ctx);

        let ret = pattern.exec(ctx.path);
        if (ret === null)
            await next(false);
        else
            await next(true, ret.groups || ret);
    };
}

function PathFullString(pattern) {

    return async function (ctx, next) {
        init_path(ctx);

        await next(ctx.path == pattern);
    };
}
