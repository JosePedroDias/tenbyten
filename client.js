(function() {
    'use strict';

    var c = window.common();
    //var c = window.common(true, 42);



    var svgScale = function(s) {
        var bbox = s.node.getBoundingClientRect();
        var vb = s.node.getAttribute('viewBox').split(' ').map(parseFloat);
        return Math.max(
            vb[2] / bbox.width,
            vb[3] / bbox.height
        );
    };



    var hasTouch = function() { // from modernizr
        return (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch);
    };



    var loadHighScore = function() {
        try {
            var hsc = localStorage.getItem(LS_KEY);
            if (hsc && hsc.length > 0) {
                return parseInt(hsc, 10);
            }
        } catch (ex) {}
        return 0;
    };



    var saveHighScore = function(hsc) {
        try {
            localStorage.setItem(LS_KEY, hsc);
        } catch (ex) {}
    };



    var l = 10;
    var L = 9.5;
    var R = 1;
    var LS_KEY = 'ten_by_ten_high_score';
    var slotY = 100 + 50*0.25;
    var slotXs = c.seq(3).map(function(i) { return (i+0.5)*0.33333*100; });
    var gap = hasTouch() ? -2*10 : 0; // finger gap so you can see the piece while dragging

    var s;
    var sSlots = new Array(3);
    var sMatrix = c.mtx(10, 10);

    var st = c.initialState();
    var highScore = loadHighScore(LS_KEY);



    var updateScore = function() {
        var score = st.score;

        if (score > highScore) {
            highScore = score;
            saveHighScore(highScore);
            updateHighScore(highScore);
        }

        //console.log(score);
        s.select('.score').attr('text', score);
    };



    var updateHighScore = function(highScore) {
        s.select('.high-score').attr('text', highScore);
    };



    var alert = function(msg, cb) {
        var g = s.group();
        g.addClass('alert');
        var r = s.rect(-5, -10, 110, 140);
        r.attr('fill', 'fill-0');
        r.attr('opacity', 0.75);
        var t = s.text(50, 60, msg);
        t.attr('text-anchor', 'middle');
        g.add(r);
        g.add(t);
        g.addClass('score');

        var onClick = function() {
            g.remove();
            if (cb) { cb(); }
        };

        g.node.addEventListener('mousedown',  onClick);
        g.node.addEventListener('touchstart', onClick);
    };



    var updateFromMatrix = function() {
        c.seq(10).forEach(function(y) {
            c.seq(10).forEach(function(x) {
                var v = st.m.get(x, y);
                var r = sMatrix.get(x, y);
                r.attr('class', 'fill-' + v);
            });
        });
    };



    var checkSlots = function() {
        if (!sSlots[0] && !sSlots[1] && !sSlots[2]) {
            c.seq(3).forEach(function(i) {
                createPiece(st.slots[i], i);
            });
        }
    };



    var reset = function() {
        st = c.initialState();
        updateScore(0);

        c.seq(10).forEach(function(y) {
            c.seq(10).forEach(function(x) {
                var r = sMatrix.get(x, y);
                r.attr('class', 'fill-0');
            });
        });

        checkSlots();
    };



    var createPiece = function(p, slot) {
        var g = s.group();
        g.addClass('in-slot-' + slot);
        var dims = p.dims;

        var r = s.rect((dims[0]-5)*5, (dims[1]-5)*5, 50, 50);
        r.attr('class', 'trans');
        g.add(r);

        p.p.forEach(function(pos) {
            var r = s.rect(pos[0]*l, pos[1]*l, L, L, R, R);
            r.attr('class', 'fill-' + p.t);
            g.add(r);
        });

        g.transform(
            Snap
                .matrix()
                .translate(slotXs[slot], slotY)
                .scale(0.5, 0.5)
                .translate(-dims[0]*10/2, -dims[1]*10/2)
                .toTransformString()
        );

        sSlots[slot] = g;

        var scl;
        var lastPos;
        g.drag(
            function(dx, dy/*, x, y, ev*/) { // move
                lastPos = [
                    slotXs[slot] + dx*scl,
                    slotY + dy*scl + gap
                ];
                g.transform(
                    Snap
                        .matrix()
                        .translate(lastPos[0], lastPos[1])
                        .translate(-dims[0]*5, -dims[1]*5)
                        .toTransformString()
                );
            },
            function(/*x, y, ev*/) { // start
                lastPos = [
                    slotXs[slot],
                    slotY
                ];
                scl = svgScale(s);
                //console.log('start', scl);
                g.transform(
                    Snap
                        .matrix()
                        .translate(slotXs[slot], slotY + gap)
                        .translate(-dims[0]*5, -dims[1]*5)
                        .toTransformString()
                );
            },
            function(/*ev*/) { // end
                var pos2 = [
                    Math.round( lastPos[0]/10 - dims[0]/2 ),
                    Math.round( lastPos[1]/10 - dims[1]/2 )
                ];

                var slot = parseInt( g.attr('class').substring(8), 10);

                //console.log('end', pos2);

                var result = c.playPiece(slot, pos2, st);

                g.remove();
                sSlots[slot] = undefined;

                if (typeof result === 'object') {
                    createPiece(p, slot);
                }
                else {
                    st.ended = result;
                    updateScore(st.score);
                    updateFromMatrix();

                    if (st.ended) {
                        alert('game over', reset);
                    }
                    else {
                        checkSlots();
                    }
                }
            }
        );

        return g;
    };



    // http://snapsvg.io/docs

    s = Snap('svg');
    s.select('desc').remove();



    // setup scores
    (function() {
        var sc = s.text(25, -2, '0');
        sc.attr('text-anchor', 'middle');
        sc.addClass('score');
        var hsc = s.text(75, -2, loadHighScore());
        hsc.attr('text-anchor', 'middle');
        hsc.addClass('high-score');
    })();



    // setup empty matrix
    var mtxG = s.group();
    mtxG.addClass('matrix');
    c.seq(10).forEach(function(y) {
        c.seq(10).forEach(function(x) {
            var r = s.rect(x*l, y*l, L, L, R, R);
            mtxG.add(r);
            r.attr('class', 'fill-0');
            sMatrix.set(x, y, r);
        });
    });



    // populate slots
    c.seq(3).forEach(function(slot) {
        createPiece(st.slots[slot], slot);
    });



    // load high score
    updateHighScore(highScore);



    // setup fullscreen
    var setFullScreen = function setFullScreen(ev) {
        ev.stopPropagation();
        ev.preventDefault();
        s.node.requestFullscreen();
        s.node.removeEventListener('mousedown',  setFullScreen);
        s.node.removeEventListener('touchstart', setFullScreen);
    };
    s.node.addEventListener('mousedown',  setFullScreen);
    s.node.addEventListener('touchstart', setFullScreen);



    // toggle theme
    (function() {
        var g = s.group();
        g.addClass('toggle-theme');
        var r = s.rect(45, -10, 10, 10, 5, 5);
        r.addClass('fill-0');
        g.add(r);
        var p = s.path('m 3.65625,2.25 c -0.6528271,0 -1.1875,0.5034229 -1.1875,1.15625 0,0.6528271 0.5346729,1.1875 1.1875,1.1875 0.2040085,0 0.3950117,-0.065265 0.5625,-0.15625 C 4.1590782,4.4479734 4.0939232,4.46875 4.03125,4.46875 3.448244,4.46875 3,3.989256 3,3.40625 3,2.823244 3.448244,2.375 4.03125,2.375 c 0.062673,0 0.1278282,0.020777 0.1875,0.03125 C 4.0512617,2.3152649 3.8602585,2.25 3.65625,2.25 z M 1.1099513,0.93568927 0.99436726,1.0500389 0.61613213,0.66772097 0.73171614,0.5533713 z M 2.6139245,2.4796422 2.4983405,2.5939919 2.1201124,2.211681 2.2356964,2.0973314 z M 0.97979648,2.082203 1.0947717,2.1971681 0.71456366,2.5775359 0.59959552,2.4625638 z M 2.5155208,0.5699123 2.6304961,0.6848774 2.250288,1.0652452 2.1353199,0.95027307 z M 0.80673956,1.4796942 0.80585963,1.642291 0.26807024,1.6394041 0.26895017,1.4768072 z m 2.15518374,0.028173 -8.728e-4,0.1625898 -0.5377894,-0.00289 8.728e-4,-0.1625898 z m -1.4365851,0.8744801 0.1625874,3.1e-6 -2e-6,0.5378048 -0.1625874,-3e-6 z m 0.016668,-2.15519598 0.1625945,-3.98e-6 -2e-6,0.53780487 -0.1625874,-3.05e-6 z M 2.3090987,1.5737447 c 4.1e-6,0.3798986 -0.3079722,0.6878777 -0.6880326,0.6877184 -0.3799057,-3e-6 -0.68787772,-0.3079722 -0.6877184,-0.6880326 -1.121e-5,-0.3799057 0.3079722,-0.68787773 0.6880326,-0.6877184 0.3799056,2.93e-6 0.6878847,0.3079793 0.6877254,0.6880397 z');
        p.transform(
            Snap
                .matrix()
                .translate(45, -10)
                .scale(1.8, 1.8)
                .translate(0.3, 0.3)
                .toTransformString()
        );
        p.attr('opacity', 0.75);
        g.add(p);
        g.drag(c.noop, function() {
            var theme = document.documentElement.className;
            theme = (theme === 'dark') ? 'light' : 'dark';
            document.documentElement.className = theme;
        }, c.noop);
    })();



    // begin to capture the initial click to FS
    alert('begin', function() {});

})();
