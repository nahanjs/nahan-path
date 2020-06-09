'use strict';

const http = require('http');
const request = require('supertest');
const expect = require('chai').expect;
const { Pipeline, Branch } = require('nahan-onion');
const PathFull = require('..').PathFull;

describe('PathFull', () => {

    const app =
        Pipeline(
            async (ctx, next) => {
                await next();
                ctx.res.end();
            },
            Branch(
                PathFull('/'),
                async ctx => ctx.res.write('PathFull (string): /')
            ),
            Branch(
                PathFull('/test'),
                async ctx => ctx.res.write('PathFull (string): /test')
            ),
            Branch(
                PathFull(new String('/test/String')),
                async ctx => ctx.res.write('PathFull (string): /test/String')
            ),
            Branch(
                PathFull(/\/test\/(\d+)/),
                async (ctx, _, matches) => ctx.res.write('PathFull (RegExp): /test/' + matches[1])
            ),
            Branch(
                PathFull(/^\/test\/(\d+)\/(\d+)/),
                async (ctx, _, matches) => ctx.res.write('PathFull (RegExp): /test/' + matches[1] + '/' + matches[2])
            ),
            Branch(
                PathFull(/\/test\/(?<s1>[a-z]+)$/),
                async (ctx, _, groups) => ctx.res.write('PathFull (RegExp): /test/' + groups.s1)
            ),
            Branch(
                PathFull(/^\/test\/(?<s1>[a-z]+)\/(?<s2>[A-Z]+)$/),
                async (ctx, _, groups) => ctx.res.write('PathFull (RegExp): /test/' + groups.s1 + '/' + groups.s2)
            ),
            Branch(
                PathFull(/\/case/i),
                async (ctx, _, matches) => ctx.res.write('PathFull (RegExp): ' + matches[0])
            ),
            Branch(
                PathFull(/\/depth1\/.+/),
                Pipeline(
                    async (ctx, next) => {
                        ctx.res.write(ctx.path);
                        await next();
                    },
                    Branch(
                        PathFull(/\/depth1\/depth2/),
                        async (ctx) => ctx.res.write(' ' + ctx.path)
                    ),
                )
            ),
            async ctx => ctx.res.write('Other path: ' + ctx.path)
        );

    const server = http.createServer((req, res) => app({ req, res }));

    const agent = request.agent(server);

    describe('PathFull (string): /', () => {
        it('GET /', done => { agent.get('/').expect('PathFull (string): /', done) });
        it('GET //', done => { agent.get('//').expect('PathFull (string): /', done) });
        it('GET ///', done => { agent.get('///').expect('PathFull (string): /', done) });
    });

    describe('PathFull (string): /test', () => {
        it('GET /test', done => { agent.get('/test').expect('PathFull (string): /test', done) });
        it('GET /test/', done => { agent.get('/test/').expect('PathFull (string): /test', done) });
        it('GET //test//', done => { agent.get('//test//').expect('PathFull (string): /test', done) });
    });

    describe('PathFull (String): /test/String', () => {
        it('GET /test/String', done => { agent.get('/test/String').expect('PathFull (string): /test/String', done) });
        it('GET /test/String/', done => { agent.get('/test/String/').expect('PathFull (string): /test/String', done) });
        it('GET //test//String//', done => { agent.get('//test//String//').expect('PathFull (string): /test/String', done) });
    });

    describe('PathFull (RegExp): ' + /\/test\/(\d+)/, () => {
        it('GET /test/1', done => { agent.get('/test/1').expect('PathFull (RegExp): /test/1', done) });
        it('GET //test//123//', done => { agent.get('//test//123//').expect('PathFull (RegExp): /test/123', done) });
    });

    describe('PathFull (RegExp): ' + /^\/test\/(\d+)\/(\d+)/, () => {
        it('GET /test/1/9', done => { agent.get('/test/1/9').expect('PathFull (RegExp): /test/1/9', done) });
        it('GET //test//123//789//', done => { agent.get('//test//123//789//').expect('PathFull (RegExp): /test/123/789', done) });
    });

    describe('PathFull (RegExp): ' + /\/test\/(?<s1>[a-z]+)$/, () => {
        it('GET /test/a', done => { agent.get('/test/a').expect('PathFull (RegExp): /test/a', done); });
        it('GET //test//abc//', done => { agent.get('//test//abc//').expect('PathFull (RegExp): /test/abc', done) });
    });

    describe('PathFull (RegExp): ' + /^\/test\/(?<s1>[a-z]+)\/(?<s2>[A-Z]+)$/, () => {
        it('GET /test/a/Z', done => { agent.get('/test/a/Z').expect('PathFull (RegExp): /test/a/Z', done); });
        it('GET //test//abc//XYZ//', done => { agent.get('//test//abc//XYZ//').expect('PathFull (RegExp): /test/abc/XYZ', done) });
    });

    describe('PathFull (RegExp): ' + /\/case/i, () => {
        it('GET /case', done => { agent.get('/case').expect('PathFull (RegExp): /case', done); });
        it('GET /CASE', done => { agent.get('/CASE').expect('PathFull (RegExp): /CASE', done); });
    });

    describe('', () => {
        it('GET /depth1', done => { agent.get('/depth1').expect('Other path: /depth1', done); });
        it('GET /depth1/', done => { agent.get('/depth1/').expect('Other path: /depth1', done); });
        it('GET /depth1/other', done => { agent.get('/depth1/other').expect('/depth1/other', done); });
        it('GET /depth1/depth2', done => { agent.get('/depth1/depth2').expect('/depth1/depth2 /depth1/depth2', done); });
    });

    describe('Other path', () => {
        it('GET /other', done => { agent.get('/other').expect('Other path: /other', done); });
        it('GET /other?123', done => { agent.get('/other?123').expect('Other path: /other', done); });
        it('GET /other?123#456', done => { agent.get('/other?123#456').expect('Other path: /other', done); });
        it('GET /TEST/a', done => { agent.get('/Test/a').expect('Other path: /Test/a', done); });
        it('GET /test/A', done => { agent.get('/test/A').expect('Other path: /test/A', done); });
        it('GET /test/a/z', done => { agent.get('/test/a/z').expect('Other path: /test/a/z', done); });
        it('GET /test/A/z', done => { agent.get('/test/A/z').expect('Other path: /test/A/z', done); });
    });

    describe('Error handler', () => {
        it('Error type of "pattern"', () => {
            const PathFull_123 = PathFull.bind(null, 123);
            expect(PathFull_123).to.throw(TypeError);
            expect(PathFull_123).to.throw('Type of "pattern" should be "string", "String" or "RegExp"');
        });
    });
});
