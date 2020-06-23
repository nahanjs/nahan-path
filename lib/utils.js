'use strict';

exports.init_path = function (ctx) {

    if (ctx.path === undefined) {
        // split path from requested url
        ctx.path = ctx.req.url.split('?')[0];
    }
}
