# nahan-path

Path middleware for nahan

[![Build Status][travis-ci-image]][travis-ci-url]
[![Coverage Status][coveralls-image]][coveralls-url]

[travis-ci-image]: https://travis-ci.org/LabMemNo003/nahan-path.svg?branch=master
[travis-ci-url]: https://travis-ci.org/LabMemNo003/nahan-path
[coveralls-image]: https://coveralls.io/repos/github/LabMemNo003/nahan-path/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/LabMemNo003/nahan-path?branch=master

# Note

- Path middleware will match the pattern with ctx.path attribute. 
- If ctx.path is undefined, set ctx.path to ctx.req.url.split('?')[0].
- Path middleware doesn't normalize the requested url, and leaves this task to users.

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
            Path("/foo", 'full'), // match full ctx.path, and remain ctx.path unchanged
            async ctx => ctx.res.write(ctx.path)
            // before ==> after
            // /foo   ==> /foo
        ),
        Branch(
            Path("/bar", 'chop'), // match forward part of ctx.path, and remove the matched part
            async ctx => ctx.res.write(ctx.path)
            // before   ==> after
            // /bar     ==> /
            // /bar/123 ==> /123
        ),
        Branch(
            Path("/baz/123"), // Default mode is "chop"
            async ctx => ctx.res.write(ctx.path)
        ),
        Branch(
            // before: ctx.path = '/img123/abc'
            Path(/\/img(\d+)/, 'full'),
            // after: ctx.path = '/img123/abc'
            async (ctx, _, matches) => console.log(matches[0]) // '123'
        ),
        Branch(
            // before: ctx.path = '/art123/abc'
            Path(/\/art(?<num>\d+)/, 'chop'),
            // after: ctx.path = '/abc'
            async (ctx, _, groups) => console.log(groups.num) // '123'
        ),
    );

http.createServer((req, res) => app({ req, res })).listen(3000);
```
