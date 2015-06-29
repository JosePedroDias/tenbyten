var express = require('express');
var fs = require('fs');

var c = require('./common')();
//var c = require('./common')(true, 42); // deterministic random



/////////////////////


var PORT = 3000;


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
        m: sendMatrix ? c.renderMatrix(st.m) : undefined
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

app.use(allowCrossDomain);

//app.use('/static', express.static('static'));

// new-game
app.get('/new-game', function (req, res) {
    var sessionId, st = c.initialState();
    do {
        sessionId = c.randomBase32(6);
    } while (sessionId in sessions);
    st.id = sessionId;
    sessions[sessionId] = st;
    res.send( simplifySession(st) );
});

// this endpoint is for debugging purposes only
app.get('/get/:sessionId', function (req, res) {
    var st = sessions[req.params.sessionId];

    if (!st) {
        return res.send({err:'inactive session'});
    }

    res.send( simplifySession(st, true) );
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

    res.send( simplifySession(st) );
});

// this endpoint is for debugging purposes only
app.get('/active-sessions', function(req, res) {
    res.send(Object.keys(sessions));
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
        name: p.name,
        email: p.email,
        score: st.score
    };

    highscores.push(line);
    highscores.sort(function(a, b) { return b.score - a.score; });
    var rank = highscores.indexOf(line);

    try {
        fs.writeFileSync('highscores.json', JSON.stringify(highscores));
    } catch (ex) {}

    delete sessions[p.sessionId];

    res.send({
        score: line.score,
        rank: rank
    });
});

// highscores
app.get('/highscores', function (req, res) {
    res.send(highscores);
});

app.listen(PORT, function() {
    console.log('tenbyten server listening on port %s...', PORT);
});



/*



var st = initialState();
console.log( renderState(st) );

playPiece(0, [0, 0], st);
console.log( renderState(st) );

playPiece(1, [5, 0], st);
console.log( renderState(st) );

playPiece(2, [0, 5], st);
console.log( renderState(st) );
*/