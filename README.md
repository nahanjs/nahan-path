# nahan-path

Path middleware for nahan

[![Build Status][travis-ci-image]][travis-ci-url]
[![Coverage Status][coveralls-image]][coveralls-url]

[travis-ci-image]: https://travis-ci.org/LabMemNo003/nahan-path.svg?branch=master
[travis-ci-url]: https://travis-ci.org/LabMemNo003/nahan-path
[coveralls-image]: https://coveralls.io/repos/github/LabMemNo003/nahan-path/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/LabMemNo003/nahan-path?branch=master

# Example

``` javascript
const http = require('http');
const { Pipeline, Branch } = require('nahan-onion');
const Path = require('nahan-path');

const app =
    Pipeline(
        async (ctx, next) => {
            await next();
            ctx.res.end();
        },
        Branch(
            Path('/'),
            async ctx => ctx.res.write('Path (string): /')
        ),
        Branch(
            Path('/test'),
            async ctx => ctx.res.write('Path (string): /test')
        ),
        Branch(
            Path(new String('/test/String')),
            async ctx => ctx.res.write('Path (string): /test/String')
        ),
        Branch(
            Path(/\/test\/(\d+)/),
            async (ctx, _, matches) => ctx.res.write('Path (RegExp): /test/' + matches[1])
        ),
        Branch(
            Path(/\/test\/(\d+)\/(\d+)/),
            async (ctx, _, matches) => ctx.res.write('Path (RegExp): /test/' + matches[1] + '/' + matches[2])
        ),
        Branch(
            Path(/\/test\/(?<s1>[a-zA-Z]+)/),
            async (ctx, _, groups) => ctx.res.write('Path (RegExp): /test/' + groups.s1)
        ),
        Branch(
            Path(/\/test\/(?<s1>[a-zA-Z]+)\/(?<s2>[a-zA-Z]+)/),
            async (ctx, _, groups) => ctx.res.write('Path (RegExp): /test/' + groups.s1 + '/' + groups.s2)
        ),
        async ctx => ctx.res.write('ctx.req.url: ' + ctx.req.url)
    );

http.createServer((req, res) => app({ req, res })).listen(3000);
```
