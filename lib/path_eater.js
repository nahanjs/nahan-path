'use strict';

const { init_path } = require('./utils');

module.exports = PathEater;

function PathEater(pattern) {

    let path;

    if (pattern instanceof RegExp) {

        pattern = ((pat) => {
            let source = pat.source;
            source = source[0] === '^' ? source : '^' + source;

            let flags = '';
            if (pat.ignoreCase) flags += 'i';

            return new RegExp(source, flags);
        })(pattern);

        path = path_re;

    } else if (typeof pattern === 'string' || pattern instanceof String) {
        path = path_str
    } else {
        throw new TypeError('Type of "pattern" should be "string", "String" or "RegExp"');
    }

    return path;

    async function path_str(ctx, next) {

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
    }

    async function path_re(ctx, next) {

        init_path(ctx);

        let ret = pattern.exec(ctx.path);

        let flag = false;

        if (ret !== null) {
            if (ctx.path.length === ret[0].length) {
                ctx.path = '/';
                flag = true;
            } else if (ctx.path[ret[0].length] === '/') {
                ctx.path = ctx.path.substr(ret[0].length);
                flag = true;
            } else if (ret[0][ret[0].length - 1] === '/') {
                ctx.path = ctx.path.substr(ret[0].length - 1);
                flag = true;
            }
        }

        if (flag)
            await next(true, ret.groups || ret);
        else
            await next(false);
    }
}
