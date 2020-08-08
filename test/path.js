'use strict';

const http = require('http');
const request = require('supertest');
const expect = require('chai').expect;

const { Pipeline, Branch } = require('nahan-onion');
const Context = require('nahan-context');
const Path = require('..');

const {
    Middleware,
    Callback,
} = require('./util');

const app = Pipeline(
    async (ctx, next) => { await next(); ctx.res.end(); },
    Context(),

    Branch(Path('/1', 'c'), Pipeline(
        Branch(Path('/1/2', 'f'), Middleware()),
        Branch(Path('/3', 'r'), Middleware()),
        Branch(Path('/4', 'chop'), Pipeline(
            Branch(Path('/1/4/5'), Middleware()),
            Branch(Path('/6', 'rest'), Middleware()),
            (ctx, next) => ctx.res.write('miss'),
        )),
        (ctx, next) => ctx.res.write('miss'),
    )),
    (ctx, next) => ctx.res.write('miss'),
);

const server = http.createServer((req, res) => app({ req, res }));
const agent = request.agent(server);

describe('Path', () => {

    it('test (1)', done => { agent.get('/1').expect(200).expect('miss', done); });
    it('test (2)', Callback('/1/2', agent, '/1/2', '/1', '/2', ['/1/2'], undefined, [['/1'], ['/1/2']]));
    it('test (3)', Callback('/1/3', agent, '/1/3', '/1', '/3', ['/3'], undefined, [['/1'], ['/3']]));
    it('test (4)', done => { agent.get('/1/4').expect(200).expect('miss', done); });
    it('test (5)', Callback('/1/4/5', agent, '/1/4/5', '/1/4', '/5', ['/1/4/5'], undefined, [['/1'], ['/4'], ['/1/4/5']]));
    it('test (6)', Callback('/1/4/6', agent, '/1/4/6', '/1/4', '/6', ['/6'], undefined, [['/1'], ['/4'], ['/6']]));
    it('test (7)', done => { agent.get('/7').expect(200).expect('miss', done); });

    it('invalid mode', () => {
        const PathErr = Path.bind(null, 'pattern', 'wrong');
        expect(PathErr).to.throw(TypeError);
        expect(PathErr).to.throw('Invalid mode');
    });
});
