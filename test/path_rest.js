'use strict';

const http = require('http');
const request = require('supertest');
const expect = require('chai').expect;

const { Pipeline, Branch } = require('nahan-onion');
const Context = require('nahan-context');
const PathChop = require('../lib/path_chop');
const PathRest = require('..').PathRest;

const {
    Middleware,
    Callback,
} = require('./util');

const app = Pipeline(
    async (ctx, next) => { await next(); ctx.res.end(); },
    Context(),

    Branch(PathChop('/a'), Pipeline(
        Branch(PathRest('/b'), Middleware()),
        Branch(PathRest('/b/c'), Middleware()),
        Branch(PathRest('/:c'), Middleware()),
        Branch(PathRest('/(.*)'), Middleware()),
    )),

    Branch(PathChop(/\/1/), Pipeline(
        Branch(PathRest(/\/2/), Middleware()),
        Branch(PathChop(/\/2/), Pipeline(
            Branch(PathRest(/\/3/), Middleware()),
            (ctx, next) => ctx.res.write('miss'),
        )),
        Branch(PathChop(/\/3/), Pipeline(
            Branch(PathRest(/\/2/), Middleware()),
            (ctx, next) => ctx.res.write('miss'),
        )),
        (ctx, next) => ctx.res.write('miss'),
    )),

    (ctx, next) => ctx.res.write('miss'),
);

const server = http.createServer((req, res) => app({ req, res }));
const agent = request.agent(server);

describe('PathRest', () => {

    it('test (1)', Callback('/a', agent, '/a', '/a', '/', ['/', ''], undefined, [['/a'], ['/', '']]));
    it('test (2)', Callback('/a/b', agent, '/a/b', '/a', '/b', ['/b'], undefined, [['/a'], ['/b']]));
    it('test (3)', Callback('/a/b/c', agent, '/a/b/c', '/a', '/b/c', ['/b/c'], undefined, [['/a'], ['/b/c']]));
    it('test (4)', Callback('/a/d', agent, '/a/d', '/a', '/d', ['/d', 'd'], undefined, [['/a'], ['/d', 'd']]));
    it('test (5)', Callback('/a/c/b', agent, '/a/c/b', '/a', '/c/b', ['/c/b', 'c/b'], undefined, [['/a'], ['/c/b', 'c/b']]));

    it('test (6)', Callback('/1/2', agent, '/1/2', '/1', '/2', ['/2'], undefined, [['/1'], ['/2']]));
    it('test (7)', Callback('/1/2/3', agent, '/1/2/3', '/1/2', '/3', ['/3'], undefined, [['/1'], ['/2'], ['/3']]));
    it('test (8)', Callback('/1/3/2', agent, '/1/3/2', '/1/3', '/2', ['/2'], undefined, [['/1'], ['/3'], ['/2']]));
    it('test (9)', done => { agent.get('/1/2/3/4').expect(200).expect('miss', done); });

    it('test (10)', done => { agent.get('/miss').expect(200).expect('miss', done); });

    it('invalid pattern type', () => {
        const PathRestErr = PathRest.bind(null, 123);
        expect(PathRestErr).to.throw(TypeError);
        expect(PathRestErr).to.throw('Invalid pattern');
    });
});
