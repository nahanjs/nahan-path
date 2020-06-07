'use strict';

module.exports = Path;

// The ctx.path should exactly match to the given pattern.
function Path(pattern) {

    async function path_str(ctx, next) {

        init_path(ctx);

        await next(ctx.path == pattern);
    }

    async function path_re(ctx, next) {

        init_path(ctx);

        let ret = ctx.path.match(pattern);

        if (ret === null || ret[0].length !== ctx.path.length)
            await next(false);
        else
            await next(true, ret.groups || ret);
    }

    let path;
    if (pattern instanceof RegExp && !pattern.global)
        path = path_re;
    else if (typeof pattern === 'string' || pattern instanceof String)
        path = path_str;
    else
        throw new TypeError('Type of "pattern" should be "string", "String" or "RegExp"');

    return path;
}

function init_path(ctx) {

    if (ctx.path === undefined) {

        // split path from requested url
        let path = ctx.req.url.split('?')[0];

        // replace continuous slashes with one slash
        path = path.replace(/\/\/+/g, '/');

        // remove the slash at the end of the path
        if (path.length > 1 && path.charAt(path.length - 1) === '/')
            path = path.slice(0, -1);

        ctx.path = path;
    }
}
