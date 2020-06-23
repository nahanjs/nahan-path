'use strict';

exports.init_path = function (ctx) {

    if (ctx.path === undefined) {
        // split path from requested url
        ctx.path = ctx.req.url.split('?')[0];
    }
}

exports.isRegExp = function (val) {
    return (val instanceof RegExp);
}

exports.isString = function (val) {
    return ((typeof val === 'string') || (val instanceof String));
}
