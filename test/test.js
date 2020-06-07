'use strict';

const http = require('http');
const request = require('supertest');
const expect = require('chai').expect;
const { Pipeline, Branch } = require('nahan-onion');
const Path = require('..');

describe('nahan-path', () => {

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

    const server = http.createServer((req, res) => app({ req, res }));

    const agent = request.agent(server);

    describe('Path (string): /', () => {
        it('GET /', done => { agent.get('/').expect('Path (string): /', done) });
        it('GET //', done => { agent.get('//').expect('Path (string): /', done) });
        it('GET ///', done => { agent.get('///').expect('Path (string): /', done) });
    });

    describe('Path (string): /test', () => {
        it('GET /test', done => { agent.get('/test').expect('Path (string): /test', done) });
        it('GET /test/', done => { agent.get('/test/').expect('Path (string): /test', done) });
        it('GET //test//', done => { agent.get('//test//').expect('Path (string): /test', done) });
    });

    describe('Path (String): /test/String', () => {
        it('GET /test/String', done => { agent.get('/test/String').expect('Path (string): /test/String', done) });
        it('GET /test/String/', done => { agent.get('/test/String/').expect('Path (string): /test/String', done) });
        it('GET //test//String//', done => { agent.get('//test//String//').expect('Path (string): /test/String', done) });
    });

    describe('Path (RegExp): ' + /\/test\/(\d+)/.source, () => {
        it('GET /test/1', done => { agent.get('/test/1').expect('Path (RegExp): /test/1', done) });
        it('GET //test//123//', done => { agent.get('//test//123//').expect('Path (RegExp): /test/123', done) });
    });

    describe('Path (RegExp): ' + /\/test\/(\d+)\/(\d+)/.source, () => {
        it('GET /test/1/9', done => { agent.get('/test/1/9').expect('Path (RegExp): /test/1/9', done) });
        it('GET //test//123//789//', done => { agent.get('//test//123//789//').expect('Path (RegExp): /test/123/789', done) });
    });

    describe('Path (RegExp): ' + /\/test\/(?<s1>[a-zA-Z]+)/.source, () => {
        it('GET /test/a', done => { agent.get('/test/a').expect('Path (RegExp): /test/a', done); });
        it('GET //test//abc//', done => { agent.get('//test//abc//').expect('Path (RegExp): /test/abc', done) });
    });

    describe('Path (RegExp): ' + /\/test\/(?<s1>[a-zA-Z]+)\/(?<s2>[a-zA-Z]+)/.source, () => {
        it('GET /test/a/z', done => { agent.get('/test/a/z').expect('Path (RegExp): /test/a/z', done); });
        it('GET //test//abc//xyz//', done => { agent.get('//test//abc//xyz//').expect('Path (RegExp): /test/abc/xyz', done) });
    });

    describe('Error handler', () => {
        it('Error type of "pattern"', () => {
            const Path_123 = Path.bind(null, 123);
            expect(Path_123).to.throw(TypeError);
        });
    });
});
