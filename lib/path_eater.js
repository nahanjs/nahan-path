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

        if ((ctx.path.substr(0, pattern.length) == pattern) &&
            (ctx.path.length === pattern.length ||
                ctx.path[pattern.length] === '/')) {
            ctx.path = ctx.path.slice(pattern.length) || '/';
            await next(true);
        }
        else {
            await next(false);
        }
    }

    async function path_re(ctx, next) {

        init_path(ctx);

        let ret = pattern.exec(ctx.path);

        if ((ret !== null) &&
            (ctx.path.length === ret[0].length ||
                ctx.path[ret[0].length] === '/')) {
            ctx.path = ctx.path.slice(ret[0].length) || '/';
            await next(true, ret.groups || ret);
        }
        else {
            await next(false);
        }
    }
}
