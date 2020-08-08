'use strict';

const http = require('http');
const request = require('supertest');
const expect = require('chai').expect;

const { Pipeline, Branch } = require('nahan-onion');
const Context = require('nahan-context');
const PathFull = require('..').PathFull;

const {
    Middleware,
    Callback,
} = require('./util');

const app = Pipeline(
    async (ctx, next) => { await next(); ctx.res.end(); },
    Context(),

    Branch(PathFull('/1/2/:3'), Middleware()),
    Branch(PathFull('/1/2'), Middleware()),
    Branch(PathFull('/1'), Middleware()),

    Branch(PathFull(/\/a(\/b(\/c)?)?/), Pipeline(
        Branch(PathFull(/\/a/), Middleware()),
        Branch(PathFull(/\/a\/b/), Middleware()),
        Branch(PathFull(/\/a\/b\/(?<c>c)/), Middleware()),
    )),

    Branch(PathFull(/\/x/), Middleware()),
    Branch(PathFull(/\/y\/x/), Middleware()),
    Branch(PathFull(/\/z\/y\/x/), Middleware()),

    (ctx, next) => ctx.res.write('miss'),
);

const server = http.createServer((req, res) => app({ req, res }));
const agent = request.agent(server);

describe('PathFUll', () => {

    it('test (1)', Callback('/1', agent, '/1', '', '/1', ['/1'], undefined));
    it('test (2)', Callback('/1/2', agent, '/1/2', '', '/1/2', ['/1/2'], undefined));
    it('test (3)', Callback('/1/2/3', agent, '/1/2/3', '', '/1/2/3', ['/1/2/3', '3'], undefined));

    it('test (4)', Callback('/a', agent, '/a', '', '/a', ['/a'], undefined, [['/a', null, null], ['/a']]));
    it('test (5)', Callback('/a/b', agent, '/a/b', '', '/a/b', ['/a/b'], undefined, [['/a/b', '/b', null], ['/a/b']]));
    it('test (6)', Callback('/a/b/c', agent, '/a/b/c', '', '/a/b/c', ['/a/b/c', 'c'], { c: 'c' }, [['/a/b/c', '/b/c', '/c'], ['/a/b/c', 'c']]));

    it('test (7)', Callback('/x', agent, '/x', '', '/x', ['/x'], undefined));
    it('test (8)', Callback('/y/x', agent, '/y/x', '', '/y/x', ['/y/x'], undefined));
    it('test (9)', Callback('/z/y/x', agent, '/z/y/x', '', '/z/y/x', ['/z/y/x'], undefined));

    it('test (10)', done => { agent.get('/miss').expect(200).expect('miss', done); });

    it('invalid pattern type', () => {
        const PathFullErr = PathFull.bind(null, 123);
        expect(PathFullErr).to.throw(TypeError);
        expect(PathFullErr).to.throw('Invalid pattern');
    });
});
