'use strict';

const http = require('http');
const request = require('supertest');
const expect = require('chai').expect;
const { Pipeline, Branch } = require('nahan-onion');
const PathMatch = require('..').PathMatch;

describe('PathMatch', () => {

    const app =
        Pipeline(
            async (ctx, next) => {
                await next();
                ctx.res.end();
            },
            Branch(
                PathMatch('/'),
                async ctx => ctx.res.write('PathMatch (string): /')
            ),
            Branch(
                PathMatch('/test'),
                async ctx => ctx.res.write('PathMatch (string): /test')
            ),
            Branch(
                PathMatch(new String('/test/String')),
                async ctx => ctx.res.write('PathMatch (string): /test/String')
            ),
            Branch(
                PathMatch(/\/test\/(\d+)/),
                async (ctx, _, matches) => ctx.res.write('PathMatch (RegExp): /test/' + matches[1])
            ),
            Branch(
                PathMatch(/^\/test\/(\d+)\/(\d+)/),
                async (ctx, _, matches) => ctx.res.write('PathMatch (RegExp): /test/' + matches[1] + '/' + matches[2])
            ),
            Branch(
                PathMatch(/\/test\/(?<s1>[a-z]+)$/),
                async (ctx, _, groups) => ctx.res.write('PathMatch (RegExp): /test/' + groups.s1)
            ),
            Branch(
                PathMatch(/^\/test\/(?<s1>[a-z]+)\/(?<s2>[A-Z]+)$/),
                async (ctx, _, groups) => ctx.res.write('PathMatch (RegExp): /test/' + groups.s1 + '/' + groups.s2)
            ),
            Branch(
                PathMatch(/\/case/i),
                async (ctx, _, matches) => ctx.res.write('PathMatch (RegExp): ' + matches[0])
            ),
            Branch(
                PathMatch(/\/depth1\/.+/),
                Pipeline(
                    async (ctx, next) => {
                        ctx.res.write(ctx.path);
                        await next();
                    },
                    Branch(
                        PathMatch(/\/depth1\/depth2/),
                        async (ctx) => ctx.res.write(' ' + ctx.path)
                    ),
                )
            ),
            async ctx => ctx.res.write('Other path: ' + ctx.path)
        );

    const server = http.createServer((req, res) => app({ req, res }));

    const agent = request.agent(server);

    describe('PathMatch (string): /', () => {
        it('GET /', done => { agent.get('/').expect('PathMatch (string): /', done) });
        it('GET //', done => { agent.get('//').expect('PathMatch (string): /', done) });
        it('GET ///', done => { agent.get('///').expect('PathMatch (string): /', done) });
    });

    describe('PathMatch (string): /test', () => {
        it('GET /test', done => { agent.get('/test').expect('PathMatch (string): /test', done) });
        it('GET /test/', done => { agent.get('/test/').expect('PathMatch (string): /test', done) });
        it('GET //test//', done => { agent.get('//test//').expect('PathMatch (string): /test', done) });
    });

    describe('PathMatch (String): /test/String', () => {
        it('GET /test/String', done => { agent.get('/test/String').expect('PathMatch (string): /test/String', done) });
        it('GET /test/String/', done => { agent.get('/test/String/').expect('PathMatch (string): /test/String', done) });
        it('GET //test//String//', done => { agent.get('//test//String//').expect('PathMatch (string): /test/String', done) });
    });

    describe('PathMatch (RegExp): ' + /\/test\/(\d+)/, () => {
        it('GET /test/1', done => { agent.get('/test/1').expect('PathMatch (RegExp): /test/1', done) });
        it('GET //test//123//', done => { agent.get('//test//123//').expect('PathMatch (RegExp): /test/123', done) });
    });

    describe('PathMatch (RegExp): ' + /^\/test\/(\d+)\/(\d+)/, () => {
        it('GET /test/1/9', done => { agent.get('/test/1/9').expect('PathMatch (RegExp): /test/1/9', done) });
        it('GET //test//123//789//', done => { agent.get('//test//123//789//').expect('PathMatch (RegExp): /test/123/789', done) });
    });

    describe('PathMatch (RegExp): ' + /\/test\/(?<s1>[a-z]+)$/, () => {
        it('GET /test/a', done => { agent.get('/test/a').expect('PathMatch (RegExp): /test/a', done); });
        it('GET //test//abc//', done => { agent.get('//test//abc//').expect('PathMatch (RegExp): /test/abc', done) });
    });

    describe('PathMatch (RegExp): ' + /^\/test\/(?<s1>[a-z]+)\/(?<s2>[A-Z]+)$/, () => {
        it('GET /test/a/Z', done => { agent.get('/test/a/Z').expect('PathMatch (RegExp): /test/a/Z', done); });
        it('GET //test//abc//XYZ//', done => { agent.get('//test//abc//XYZ//').expect('PathMatch (RegExp): /test/abc/XYZ', done) });
    });

    describe('PathMatch (RegExp): ' + /\/case/i, () => {
        it('GET /case', done => { agent.get('/case').expect('PathMatch (RegExp): /case', done); });
        it('GET /CASE', done => { agent.get('/CASE').expect('PathMatch (RegExp): /CASE', done); });
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
            const PathMatch_123 = PathMatch.bind(null, 123);
            expect(PathMatch_123).to.throw(TypeError);
            expect(PathMatch_123).to.throw('Type of "pattern" should be "string", "String" or "RegExp"');
        });
    });
});
