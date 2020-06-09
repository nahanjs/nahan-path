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
                Path("/foo", 'match'),
                async ctx => ctx.res.write('Path("/foo")')
            ),
            Branch(
                Path("/bar", 'eater'),
                async ctx => ctx.res.write('Path("/bar")')
            ),
            Branch(
                Path("/baz"),
                async ctx => ctx.res.write('Path("/baz")')
            )
        );

    const server = http.createServer((req, res) => app({ req, res }));

    const agent = request.agent(server);

    it('GET /foo', done => { agent.get('/foo').expect('Path("/foo")', done) });
    it('GET /bar', done => { agent.get('/bar').expect('Path("/bar")', done) });
    it('GET /baz', done => { agent.get('/baz').expect('Path("/baz")', done) });

    it('Error type of "pattern"', () => {
        const Path_error = Path.bind(null, '/', 'error');
        expect(Path_error).to.throw(TypeError);
        expect(Path_error).to.throw('Invalid mode');
    });
});
