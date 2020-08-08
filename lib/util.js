'use strict';

exports.isRegExp = function (val) {
    return (val instanceof RegExp);
}

exports.isString = function (val) {
    return ((typeof val === 'string') || (val instanceof String));
}
