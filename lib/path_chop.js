'use strict';

const { init_path, isRegExp, isString } = require('./utils');

module.exports = PathChop;

function PathChop(pattern) {

    let path;

    if (isRegExp(pattern)) {
        path = PathChopRegExp(pattern);
    } else if (isString(pattern)) {
        path = PathChopString(pattern);
    } else {
        throw new TypeError('Type of "pattern" should be "string", "String" or "RegExp"');
    }

    return path;
}

function PathChopRegExp(pattern) {

    pattern = ((pat) => {
        let source = pat.source;
        if (source[0] !== '^') source = '^' + source;

        let flags = '';
        if (pat.ignoreCase) flags += 'i';

        return new RegExp(source, flags);
    })(pattern);

    return async function (ctx, next) {
        init_path(ctx);

        let flag = false;
        let ret = pattern.exec(ctx.path);

        if (ret !== null) {
            let match = ret[0];
            if (ctx.path.length === match.length) {
                ctx.path = '/';
                flag = true;
            } else if (ctx.path[match.length] === '/') {
                ctx.path = ctx.path.substr(match.length);
                flag = true;
            } else if (match[match.length - 1] === '/') {
                ctx.path = ctx.path.substr(match.length - 1);
                flag = true;
            }
        }

        if (flag)
            await next(true, ret.groups || ret);
        else
            await next(false);
    };
}

function PathChopString(pattern) {

    return async function (ctx, next) {
        init_path(ctx);

        let flag = false;

        if (ctx.path.substr(0, pattern.length) == pattern) {
            if (ctx.path.length === pattern.length) {
                ctx.path = '/';
                flag = true;
            } else if (ctx.path[pattern.length] === '/') {
                ctx.path = ctx.path.substr(pattern.length);
                flag = true;
            } else if (pattern[pattern.length - 1] === '/') {
                ctx.path = ctx.path.substr(pattern.length - 1);
                flag = true;
            }
        }

        await next(flag);
    };
}
