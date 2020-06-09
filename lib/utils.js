'use strict';

exports.init_path = function (ctx) {

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
