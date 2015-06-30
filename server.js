var express = require('express');
var winston = require('winston');

var fs = require('fs');

var c = require('./common')();
//var c = require('./common')(true, 42); // deterministic random


/////////////////////


var PORT                  = 3000;
var DEBUG                 = false;
var SESSION_DURATION      = 24 * 60 * 60 * 1000; //  1 day
var SESSION_STEP_DURATION =      10 * 60 * 1000; // 10 min
var CLEANSWEEP_INTERVAL   =       1 * 60 * 1000; //  1 min


/////////////////////


winston.remove(winston.transports.Console);

if (DEBUG) {
    winston.add(winston.transports.Console, {
        level: 'debug',
        timestamp: true
    });
}

winston.add(winston.transports.File, {
    level: 'info',
    timestamp: true,
    filename: 'app.log'
});


/////////////////////


var sessions = {};

var highscores = [];
try {
    highscores = JSON.parse( fs.readFileSync('highscores.json').toString() );
} catch (ex) {}
highscores.sort(function(a, b) { return b.score - a.score; });


/////////////////////

var simplifySession = function(st, sendMatrix) {
    return {
        slots: st.slots.map(function(p) {
            return ( (p === undefined) ? false : p.i);
        }),
        score: st.score,
        step: st.step,
        ended: st.ended,
        id: st.id,
        m: sendMatrix ? c.renderMatrix(st.m) : undefined,
        startedAt: sendMatrix ? st.startedAt : undefined,
        updatedAt: sendMatrix ? st.updatedAt : undefined
    }
};

var checkIntBetween0AndN = function(num, max) {
    return (
        num === parseInt(num, 10) &&
        num >= 0 &&
        num <= max
    );
};

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    next();
};



var app = express();

app.set('x-powered-by', false);

app.use(allowCrossDomain);

//app.use('/static', express.static('static'));



// new-game
app.get('/new-game', function (req, res) {
    var sessionId, st = c.initialState();
    do {
        sessionId = c.randomBase32(6);
    } while (sessionId in sessions);
    st.id = sessionId;
    var now = new Date().valueOf();
    st.startedAt = now;
    st.updatedAt = now;
    sessions[sessionId] = st;
    //console.log(st);
    winston.log('info', 'new game %s from %s ua %s', sessionId, req.connection.remoteAddress, req.get('User-Agent'));
    res.send( simplifySession(st) );
});



// play/asdasd/1/2/3/4
app.get('/play/:sessionId/:step/:slotIdx/:x/:y', function (req, res) {
    var p = req.params;
    var st = sessions[p.sessionId];

    if (!st) {
        return res.send({err:'inactive session'});
    }

    if (st.ended) {
        return res.send({err:'finished game'});
    }

    var step = parseInt(p.step, 10);
    var slotIdx = parseInt(p.slotIdx, 10);
    var x = parseInt(p.x, 10);
    var y = parseInt(p.y, 10);
    if (
        !checkIntBetween0AndN(step, 10000) ||
        !checkIntBetween0AndN(slotIdx, 2) ||
        !checkIntBetween0AndN(x, 9) ||
        !checkIntBetween0AndN(y, 9)
    ) {
        return res.send({err:'invalid arguments'});
    }

    if (step !== st.step) {
        return res.send({err:'incorrect step'});
    }

    var result = c.playPiece(slotIdx, [x, y], st);

    if (typeof result === 'object') { // error ocurred
        return res.send(result);
    }

    st.ended = result;
    st.updatedAt = new Date().valueOf();

    winston.log('info', 'play %s #%s', st.id, st.step);

    res.send( simplifySession(st) );
});



// highscore/asdasd/jose.pedro.dias%40gmail.com/Jos%C3%A9%20Pedro%20Dias
app.get('/highscore/:sessionId/:email/:name', function (req, res) {
    var p = req.params;

    var st = sessions[p.sessionId];
    if (!st) {
        return res.send({err:'inactive session'});
    }

    if (!st.ended) {
        return res.send({err:'unfinished game'});
    }

    var line = {
        name:  p.name.trim(32),
        email: p.email.trim(254),
        score: st.score
    };

    highscores.push(line);
    highscores.sort(function(a, b) { return b.score - a.score; });
    var rank = highscores.indexOf(line);

    try {
        fs.writeFileSync('highscores.json', JSON.stringify(highscores));
    } catch (ex) {}

    delete sessions[p.sessionId];

    winston.log('info', 'added high score %s', JSON.stringify(line));

    res.send({
        score: line.score,
        rank: rank
    });
});



// highscores
app.get('/highscores', function (req, res) {
    winston.log('info', 'highscores requested');
    res.send(highscores);
});



if (true) {
    // this endpoint is for debugging purposes only
    app.get('/get/:sessionId', function (req, res) {
        var st = sessions[req.params.sessionId];

        if (!st) {
            return res.send({err: 'inactive session'});
        }

        res.send(simplifySession(st, true));
    });


    // this endpoint is for debugging purposes only
    app.get('/active-sessions', function (req, res) {
        //res.send(Object.keys(sessions));

        var now = new Date().valueOf();
        var ids = Object.keys(sessions);
        var actives = ids.map(function(id) {
            var st = sessions[id];
            var dur = now - st.startedAt;
            var stepDur = now - st.updatedAt;
            return {
                id: id,
                step: st.step,
                score: st.score,
                ended: st.ended,
                dur: ~~(dur / 1000),
                stepDur: ~~(stepDur / 1000)
            };
        });

        actives.sort(function(a, b) { return a.stepDur - b.stepDur; });

        res.send(actives);
    });
}



app.listen(PORT, function() {
    winston.log('info', 'tenbyten server listening on port %d...', PORT);
});


///////////////////


// cleansweep - removes stale sessions
setInterval(
    function() {
        winston.log('debug', 'cleansweep called');
        var now = new Date().valueOf();
        var ids = Object.keys(sessions);
        ids.forEach(function(id) {
            var st = sessions[id];
            var dur = now - st.startedAt;
            var stepDur = now - st.updatedAt;
            winston.log('debug', '%s - dur: %s | step dur: %s', id, (dur/1000).toFixed(1), (stepDur/1000).toFixed(1));

            if (dur > SESSION_DURATION || stepDur > SESSION_STEP_DURATION) {
                winston.log('info', 'session %s removed');
                delete sessions[id];
            }
        });
    },
    CLEANSWEEP_INTERVAL
);
