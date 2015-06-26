var assert = require('assert');

var c = require('./common')(true, 42);



var initialState = c.initialState;
var playPiece = c.playPiece;
var renderState = c.renderState;




var st = initialState();
console.log( renderState(st) );

playPiece(0, [0, 0], st);
console.log( renderState(st) );

playPiece(1, [5, 0], st);
console.log( renderState(st) );

playPiece(2, [0, 5], st);
console.log( renderState(st) );




describe('Array', function() {
    describe('#indexOf()', function() {
        it('should return -1 when the value is not present', function(){
            assert.equal(-1, [1,2,3].indexOf(5));
            assert.equal(-1, [1,2,3].indexOf(0));
        })
    })
});
