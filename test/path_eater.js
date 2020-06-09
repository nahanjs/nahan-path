'use strict';

const http = require('http');
const request = require('supertest');
const expect = require('chai').expect;
const { Pipeline, Branch } = require('nahan-onion');
const PathEater = require('..').PathEater;

describe('PathEater', () => {

    describe('pattern is "string" or String()', () => {

        const app =
            Pipeline(
                async (ctx, next) => {
                    await next();
                    ctx.res.end();
                },
                Branch(
                    PathEater("/foo/"),
                    async ctx => ctx.res.write('PathEater("/foo/"); Remain path: ' + ctx.path + ' ; ')
                ),
                Branch(
                    PathEater("/foo"),
                    async ctx => ctx.res.write('PathEater("/foo"); Remain path: ' + ctx.path + ' ; ')
                ),
                Branch(
                    PathEater("/bar"),
                    async ctx => ctx.res.write('PathEater("/bar"); Remain path: ' + ctx.path + ' ; ')
                ),
                Branch(
                    PathEater("/bar/"),
                    async ctx => ctx.res.write('PathEater("/bar/"); Remain path: ' + ctx.path + ' ; ')
                ),
                Branch(
                    PathEater(new String("/")),
                    Pipeline(
                        async (ctx, next) => {
                            ctx.res.write('PathEater("/"); Remain path: ' + ctx.path + ' ; '),
                                await next();
                        },
                        Branch(
                            PathEater("/baz"),
                            async ctx => ctx.res.write('PathEater("/baz"); Remain path: ' + ctx.path + ' ; ')
                        ),
                        async ctx => ctx.res.write('Nowhere!')
                    )
                ),
                async ctx => ctx.res.write('Shoud not be here!')
            );

        const server = http.createServer((req, res) => app({ req, res }));

        const agent = request.agent(server);

        it('GET /foo', done => { agent.get('/foo').expect('PathEater("/foo"); Remain path: / ; ', done) });
        it('GET /foo/', done => { agent.get('/foo/').expect('PathEater("/foo"); Remain path: / ; ', done) });
        it('GET /foo/abc', done => { agent.get('/foo/abc').expect('PathEater("/foo/"); Remain path: /abc ; ', done) });

        it('GET /bar', done => { agent.get('/bar').expect('PathEater("/bar"); Remain path: / ; ', done) });
        it('GET /bar/', done => { agent.get('/bar/').expect('PathEater("/bar"); Remain path: / ; ', done) });
        it('GET /bar/abc', done => { agent.get('/bar/abc').expect('PathEater("/bar"); Remain path: /abc ; ', done) });

        it('GET /', done => { agent.get('/').expect('PathEater("/"); Remain path: / ; Nowhere!', done) });
        it('GET /baz', done => { agent.get('/baz').expect('PathEater("/"); Remain path: /baz ; PathEater("/baz"); Remain path: / ; ', done) });
        it('GET /bazzz', done => { agent.get('/bazzz').expect('PathEater("/"); Remain path: /bazzz ; Nowhere!', done) });
        it('GET /other', done => { agent.get('/other').expect('PathEater("/"); Remain path: /other ; Nowhere!', done) });
    });

    describe('pattern is RegExp()', () => {
        const app =
            Pipeline(
                async (ctx, next) => {
                    await next();
                    ctx.res.end();
                },
                Branch(
                    PathEater(/\/foo(\d*)\//),
                    async (ctx, _, matches) => ctx.res.write('PathEater("/foo' + matches[1] + '/"); Remain path: ' + ctx.path + ' ; ')
                ),
                Branch(
                    PathEater(/^\/foo(\d*)/),
                    async (ctx, _, matches) => ctx.res.write('PathEater("' + matches[0] + '"); Remain path: ' + ctx.path + ' ; ')
                ),
                Branch(
                    PathEater(/\/bar(?<n1>\d*)/),
                    async (ctx, _, groups) => ctx.res.write('PathEater("/bar' + groups.n1 + '"); Remain path: ' + ctx.path + ' ; ')
                ),
                Branch(
                    PathEater(/^\/bar(?<n2>\d*)\//),
                    async (ctx, _, groups) => ctx.res.write('PathEater("/bar' + groups.n2 + '/"); Remain path: ' + ctx.path + ' ; ')
                ),
                Branch(
                    PathEater(/\//),
                    Pipeline(
                        async (ctx, next) => {
                            ctx.res.write('PathEater("/"); Remain path: ' + ctx.path + ' ; '),
                                await next();
                        },
                        Branch(
                            PathEater(/\/baz/i),
                            async ctx => ctx.res.write('PathEater("/baz"); Remain path: ' + ctx.path + ' ; ')
                        ),
                        async ctx => ctx.res.write('Nowhere!')
                    )
                ),
                async ctx => ctx.res.write('Shoud not be here!')
            );

        const server = http.createServer((req, res) => app({ req, res }));

        const agent = request.agent(server);

        it('GET /foo', done => { agent.get('/foo').expect('PathEater("/foo"); Remain path: / ; ', done) });
        it('GET /foo123', done => { agent.get('/foo123').expect('PathEater("/foo123"); Remain path: / ; ', done) });
        it('GET /foo/', done => { agent.get('/foo/').expect('PathEater("/foo"); Remain path: / ; ', done) });
        it('GET /foo456/', done => { agent.get('/foo456/').expect('PathEater("/foo456"); Remain path: / ; ', done) });
        it('GET /foo/abc', done => { agent.get('/foo/abc').expect('PathEater("/foo/"); Remain path: /abc ; ', done) });
        it('GET /foo789/abc', done => { agent.get('/foo789/abc').expect('PathEater("/foo789/"); Remain path: /abc ; ', done) });

        it('GET /bar', done => { agent.get('/bar').expect('PathEater("/bar"); Remain path: / ; ', done) });
        it('GET /bar123', done => { agent.get('/bar123').expect('PathEater("/bar123"); Remain path: / ; ', done) });
        it('GET /bar123/', done => { agent.get('/bar123/').expect('PathEater("/bar123"); Remain path: / ; ', done) });
        it('GET /bar123/abc', done => { agent.get('/bar123/abc').expect('PathEater("/bar123"); Remain path: /abc ; ', done) });

        it('GET /', done => { agent.get('/').expect('PathEater("/"); Remain path: / ; Nowhere!', done) });
        it('GET /baz', done => { agent.get('/baz').expect('PathEater("/"); Remain path: /baz ; PathEater("/baz"); Remain path: / ; ', done) });
        it('GET /BAZ', done => { agent.get('/BAZ').expect('PathEater("/"); Remain path: /BAZ ; PathEater("/baz"); Remain path: / ; ', done) });
        it('GET /bazzz', done => { agent.get('/bazzz').expect('PathEater("/"); Remain path: /bazzz ; Nowhere!', done) });
        it('GET /other', done => { agent.get('/other').expect('PathEater("/"); Remain path: /other ; Nowhere!', done) });
    });

    describe('Error handler', () => {
        it('Error type of "pattern"', () => {
            const PathEater_123 = PathEater.bind(null, 123);
            expect(PathEater_123).to.throw(TypeError);
            expect(PathEater_123).to.throw('Type of "pattern" should be "string", "String" or "RegExp"');
        });
    });
});
