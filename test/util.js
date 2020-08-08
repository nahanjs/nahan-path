'use strict';

const expect = require('chai').expect;

function Middleware() {
    return (ctx, next, res) => {
        ctx.res.setHeader('Content-Type', 'application/json')
        const str = JSON.stringify({ _path: ctx.path, _res: res, _grps: res.groups });
        // console.log(str);
        ctx.res.write(str);
    };
}

function Callback(url, agent, full, chop, rest, res, grps, match) {
    return (done) => {
        agent.get(url).end(function (error, response) {
            if (error) done(error);
            try {
                const { _path, _res, _grps } = response.body;
                expect(_path.full).to.eql(full);
                expect(_path.chop).to.eql(chop);
                expect(_path.rest).to.eql(rest);
                expect(_path.match[_path.match.length - 1]).to.eql(res);
                expect(_res).to.eql(res);
                expect(_grps).to.eql(grps);
                if (match) expect(_path.match).to.eql(match);
                done();
            } catch (err) {
                done(err)
            }
        });
    }
}

module.exports = {
    Middleware,
    Callback,
};
