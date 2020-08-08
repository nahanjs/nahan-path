'use strict';

const http = require('http');
const request = require('supertest');
const expect = require('chai').expect;

const { Pipeline, Branch } = require('nahan-onion');
const Context = require('nahan-context');
const PathChop = require('..').PathChop;

const {
    Middleware,
    Callback,
} = require('./util');

const app = Pipeline(
    async (ctx, next) => { await next(); ctx.res.end(); },
    Context(),

    Branch(PathChop('/1'), Pipeline(
        Branch(PathChop('/2'), Middleware()),
        Branch(PathChop('/3'), Middleware()),
        Middleware(),
    )),

    Branch(PathChop(/\/a\//), Pipeline(
        Branch(PathChop(/\/b/), Middleware()),
        Branch(PathChop(/\/c/), Middleware()),
        Middleware(),
    )),
    Branch(PathChop(/\/a/), Middleware()),

    (ctx, next) => ctx.res.write('miss'),
);

const server = http.createServer((req, res) => app({ req, res }));
const agent = request.agent(server);

describe('PathChop', () => {

    it('test (1)', Callback('/1', agent, '/1', '/1', '/', ['/1'], undefined, [['/1']]));
    it('test (2)', Callback('/1/2', agent, '/1/2', '/1/2', '/', ['/2'], undefined, [['/1'], ['/2']]));
    it('test (3)', Callback('/1/2/3', agent, '/1/2/3', '/1/2', '/3', ['/2'], undefined, [['/1'], ['/2']]));
    it('test (4)', Callback('/1/3', agent, '/1/3', '/1/3', '/', ['/3'], undefined, [['/1'], ['/3']]));
    it('test (5)', Callback('/1/5', agent, '/1/5', '/1', '/5', ['/1'], undefined, [['/1']]));

    it('test (6)', Callback('/a', agent, '/a', '/a', '/', ['/a'], undefined, [['/a']]));
    it('test (7)', Callback('/a/', agent, '/a/', '/a', '/', ['/a/'], undefined, [['/a/']]));
    it('test (8)', Callback('/a/b', agent, '/a/b', '/a/b', '/', ['/b'], undefined, [['/a/'], ['/b']]));
    it('test (9)', Callback('/a/bc', agent, '/a/bc', '/a', '/bc', ['/a/'], undefined, [['/a/']]));
    it('test (10)', Callback('/a/c/b', agent, '/a/c/b', '/a/c', '/b', ['/c'], undefined, [['/a/'], ['/c']]));

    it('invalid pattern type', () => {
        const PathChopErr = PathChop.bind(null, 123);
        expect(PathChopErr).to.throw(TypeError);
        expect(PathChopErr).to.throw('Invalid pattern');
    });
});
