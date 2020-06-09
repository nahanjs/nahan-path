'use strict';

const { init_path } = require('./utils');

module.exports = PathFull;

function PathFull(pattern) {

    let path;

    if (pattern instanceof RegExp) {

        pattern = ((pat) => {
            let source = pat.source;
            source = source[0] === '^' ? source : '^' + source;
            source = source[source.length - 1] === '$' ? source : source + '$';

            let flags = '';
            if (pat.ignoreCase) flags += 'i';

            return new RegExp(source, flags);
        })(pattern);

        path = path_re;
        
    } else if (typeof pattern === 'string' || pattern instanceof String) {
        path = path_str;
    } else {
        throw new TypeError('Type of "pattern" should be "string", "String" or "RegExp"');
    }

    return path;

    async function path_str(ctx, next) {

        init_path(ctx);

        await next(ctx.path == pattern);
    }

    async function path_re(ctx, next) {

        init_path(ctx);

        let ret = pattern.exec(ctx.path);

        if (ret === null)
            await next(false);
        else
            await next(true, ret.groups || ret);
    }
}
