'use strict';

const http = require('http');
const request = require('supertest');
const expect = require('chai').expect;
const { Pipeline, Branch } = require('nahan-onion');
const Path = require('..');

describe('Path', () => {

    const app =
        Pipeline(
            async (ctx, next) => {
                await next();
                ctx.res.end();
            },
            Branch(
                Path("/foo", 'full'),
                async ctx => ctx.res.write('Path("/foo")')
            ),
            Branch(
                Path("/bar", 'chop'),
                async ctx => ctx.res.write('Path("/bar")')
            ),
            Branch(
                Path("/baz"),
                async ctx => ctx.res.write('Path("/baz")')
            ),
            Branch(
                Path("/m", 'f'),
                async ctx => ctx.res.write('Path("/m")')
            ),
            Branch(
                Path("/e", 'c'),
                async ctx => ctx.res.write('Path("/e")')
            )
        );

    const server = http.createServer((req, res) => app({ req, res }));

    const agent = request.agent(server);

    it('GET /foo', done => { agent.get('/foo').expect('Path("/foo")', done) });
    it('GET /bar', done => { agent.get('/bar').expect('Path("/bar")', done) });
    it('GET /baz', done => { agent.get('/baz').expect('Path("/baz")', done) });
    it('GET /m', done => { agent.get('/m').expect('Path("/m")', done) });
    it('GET /e', done => { agent.get('/e').expect('Path("/e")', done) });

    it('Error type of "pattern"', () => {
        const Path_error = Path.bind(null, '/', 'error');
        expect(Path_error).to.throw(TypeError);
        expect(Path_error).to.throw('Invalid mode');
    });
});
