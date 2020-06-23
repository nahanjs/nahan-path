'use strict';

const http = require('http');
const request = require('supertest');
const expect = require('chai').expect;
const { Pipeline, Branch } = require('nahan-onion');
const PathChop = require('..').PathChop;

describe('PathChop', () => {

    describe('pattern is "string" or String()', () => {

        const app =
            Pipeline(
                async (ctx, next) => {
                    await next();
                    ctx.res.end();
                },
                Branch(
                    PathChop("/foo/"),
                    async ctx => ctx.res.write('PathChop("/foo/"); Remain path: ' + ctx.path + ' ; ')
                ),
                Branch(
                    PathChop("/foo"),
                    async ctx => ctx.res.write('PathChop("/foo"); Remain path: ' + ctx.path + ' ; ')
                ),
                Branch(
                    PathChop("/bar"),
                    async ctx => ctx.res.write('PathChop("/bar"); Remain path: ' + ctx.path + ' ; ')
                ),
                Branch(
                    PathChop("/bar/"),
                    async ctx => ctx.res.write('PathChop("/bar/"); Remain path: ' + ctx.path + ' ; ')
                ),
                Branch(
                    PathChop(new String("/")),
                    Pipeline(
                        async (ctx, next) => {
                            ctx.res.write('PathChop("/"); Remain path: ' + ctx.path + ' ; '),
                                await next();
                        },
                        Branch(
                            PathChop("/baz"),
                            async ctx => ctx.res.write('PathChop("/baz"); Remain path: ' + ctx.path + ' ; ')
                        ),
                        async ctx => ctx.res.write('Nowhere!')
                    )
                ),
                async ctx => ctx.res.write('Shoud not be here!')
            );

        const server = http.createServer((req, res) => app({ req, res }));

        const agent = request.agent(server);

        it('GET /foo', done => { agent.get('/foo').expect('PathChop("/foo"); Remain path: / ; ', done) });
        it('GET /foo/', done => { agent.get('/foo/').expect('PathChop("/foo/"); Remain path: / ; ', done) });
        it('GET /foo/abc', done => { agent.get('/foo/abc').expect('PathChop("/foo/"); Remain path: /abc ; ', done) });

        it('GET /bar', done => { agent.get('/bar').expect('PathChop("/bar"); Remain path: / ; ', done) });
        it('GET /bar/', done => { agent.get('/bar/').expect('PathChop("/bar"); Remain path: / ; ', done) });
        it('GET /bar/abc', done => { agent.get('/bar/abc').expect('PathChop("/bar"); Remain path: /abc ; ', done) });

        it('GET /', done => { agent.get('/').expect('PathChop("/"); Remain path: / ; Nowhere!', done) });
        it('GET /baz', done => { agent.get('/baz').expect('PathChop("/"); Remain path: /baz ; PathChop("/baz"); Remain path: / ; ', done) });
        it('GET /bazzz', done => { agent.get('/bazzz').expect('PathChop("/"); Remain path: /bazzz ; Nowhere!', done) });
        it('GET /other', done => { agent.get('/other').expect('PathChop("/"); Remain path: /other ; Nowhere!', done) });
    });

    describe('pattern is RegExp()', () => {
        const app =
            Pipeline(
                async (ctx, next) => {
                    await next();
                    ctx.res.end();
                },
                Branch(
                    PathChop(/\/foo(\d*)\//),
                    async (ctx, _, matches) => ctx.res.write('PathChop("/foo' + matches[1] + '/"); Remain path: ' + ctx.path + ' ; ')
                ),
                Branch(
                    PathChop(/^\/foo(\d*)/),
                    async (ctx, _, matches) => ctx.res.write('PathChop("' + matches[0] + '"); Remain path: ' + ctx.path + ' ; ')
                ),
                Branch(
                    PathChop(/\/bar(?<n1>\d*)/),
                    async (ctx, _, groups) => ctx.res.write('PathChop("/bar' + groups.n1 + '"); Remain path: ' + ctx.path + ' ; ')
                ),
                Branch(
                    PathChop(/^\/bar(?<n2>\d*)\//),
                    async (ctx, _, groups) => ctx.res.write('PathChop("/bar' + groups.n2 + '/"); Remain path: ' + ctx.path + ' ; ')
                ),
                Branch(
                    PathChop(/\//),
                    Pipeline(
                        async (ctx, next) => {
                            ctx.res.write('PathChop("/"); Remain path: ' + ctx.path + ' ; '),
                                await next();
                        },
                        Branch(
                            PathChop(/\/baz/i),
                            async ctx => ctx.res.write('PathChop("/baz"); Remain path: ' + ctx.path + ' ; ')
                        ),
                        async ctx => ctx.res.write('Nowhere!')
                    )
                ),
                async ctx => ctx.res.write('Shoud not be here!')
            );

        const server = http.createServer((req, res) => app({ req, res }));

        const agent = request.agent(server);

        it('GET /foo', done => { agent.get('/foo').expect('PathChop("/foo"); Remain path: / ; ', done) });
        it('GET /foo123', done => { agent.get('/foo123').expect('PathChop("/foo123"); Remain path: / ; ', done) });
        it('GET /foo/', done => { agent.get('/foo/').expect('PathChop("/foo/"); Remain path: / ; ', done) });
        it('GET /foo456/', done => { agent.get('/foo456/').expect('PathChop("/foo456/"); Remain path: / ; ', done) });
        it('GET /foo/abc', done => { agent.get('/foo/abc').expect('PathChop("/foo/"); Remain path: /abc ; ', done) });
        it('GET /foo789/abc', done => { agent.get('/foo789/abc').expect('PathChop("/foo789/"); Remain path: /abc ; ', done) });

        it('GET /bar', done => { agent.get('/bar').expect('PathChop("/bar"); Remain path: / ; ', done) });
        it('GET /bar123', done => { agent.get('/bar123').expect('PathChop("/bar123"); Remain path: / ; ', done) });
        it('GET /bar123/', done => { agent.get('/bar123/').expect('PathChop("/bar123"); Remain path: / ; ', done) });
        it('GET /bar123/abc', done => { agent.get('/bar123/abc').expect('PathChop("/bar123"); Remain path: /abc ; ', done) });

        it('GET /', done => { agent.get('/').expect('PathChop("/"); Remain path: / ; Nowhere!', done) });
        it('GET /baz', done => { agent.get('/baz').expect('PathChop("/"); Remain path: /baz ; PathChop("/baz"); Remain path: / ; ', done) });
        it('GET /BAZ', done => { agent.get('/BAZ').expect('PathChop("/"); Remain path: /BAZ ; PathChop("/baz"); Remain path: / ; ', done) });
        it('GET /bazzz', done => { agent.get('/bazzz').expect('PathChop("/"); Remain path: /bazzz ; Nowhere!', done) });
        it('GET /other', done => { agent.get('/other').expect('PathChop("/"); Remain path: /other ; Nowhere!', done) });
    });

    describe('Error handler', () => {
        it('Error type of "pattern"', () => {
            const PathChop_123 = PathChop.bind(null, 123);
            expect(PathChop_123).to.throw(TypeError);
            expect(PathChop_123).to.throw('Type of "pattern" should be "string", "String" or "RegExp"');
        });
    });
});
