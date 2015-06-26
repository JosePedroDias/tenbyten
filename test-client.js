(function() {
    'use strict';

    var c = window.common;

    var initialState = c.initialState;
    var playPiece = c.playPiece;
    var seq = c.seq;
    var renderPiece = c.renderPiece;
    var renderMatrix = c.renderMatrix;
    var renderState = c.renderState;




    var st = initialState();
    console.log( renderState(st) );

    playPiece(0, [0, 0], st);
    console.log( renderState(st) );

    playPiece(1, [5, 0], st);
    console.log( renderState(st) );

    playPiece(2, [0, 5], st);
    console.log( renderState(st) );

})();

