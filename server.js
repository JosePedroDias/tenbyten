var common = require('./common');



var initialState = common.initialState;
var playPiece = common.playPiece;
var seq = common.seq;



var renderPiece = function(p) {
    var lines = seq(p.dims[1]).map(function() {
        return new Array( p.dims[0]+1).join(' ');
    });
    p.p.forEach(function(pos) {
        var arr = lines[ pos[1] ].split('');
        arr[ pos[0] ] = 'x';
        lines[ pos[1] ] = arr.join('');
    });
    return lines.join('\n');
};



var renderMatrix = function(m) {
    return seq(10).map(function(y) {
        return seq(10).map(function(x) {
            return m.get(x, y).v;
        }).join('');
    }).join('\n');
};



var renderState = function(st) {
    return [
        'score: ' + st.score,
        'step:  ' + st.step,
        ,
        'm:',
        renderMatrix(st.m),
        (st.slots[0] ? ('\nslot #0 (' + st.slots[0].i + '):\n' + renderPiece(st.slots[0])) : ''),
        (st.slots[1] ? ('\nslot #1 (' + st.slots[1].i + '):\n' + renderPiece(st.slots[1])) : ''),
        (st.slots[2] ? ('\nslot #2 (' + st.slots[2].i + '):\n' + renderPiece(st.slots[2])) : '')
    ].join('\n');
};



var st = initialState();
console.log( renderState(st) );

playPiece(0, [0, 0], st);
console.log( renderState(st) );

playPiece(1, [5, 0], st);
console.log( renderState(st) );

playPiece(2, [0, 5], st);
console.log( renderState(st) );
