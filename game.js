(function() {
    'use strict';

    /*global Snap:false*/



    var noop = function() {};



    var seq = function(n){
        var arr = new Array(n);
        for (var i = 0; i < n; ++i) {
            arr[i] = i;
        }
        return arr;
    };



    var forVK = function(arr, fn) {
        for (var k in arr) {
            fn(arr[k], k);
        }
    };



    var posFormatter = function(o) {
        return o.join(',');
    };

    var uniques = function(arr, formatter) {
        var o = {};
        arr.forEach(function(item) {
            o[ formatter(item) ] = item;
        });
        var arr2 = [];
        forVK(o, function(v) {
            arr2.push(v);
        });
        return arr2;
    };



    var mergeArrays = function(arr) {
        var arr2 = [];
        for (var i = 0, I = arr.length; i < I; ++i) {
            arr2 = arr2.concat(arr[i]);
        }
        return arr2;
    };



    var mtx = function(w, h) {
        var arr = new Array(w*h);
        return {
            get: function(x, y) {
                return arr[y*w + x];
            },
            set: function(x, y, v) {
                arr[y*w + x] = v;
            }
        };
    };



    var rnd = function(n) {
        return ~~(Math.random() * n);
    };



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



    var score = 0;
    var highScore = 0;

    var m = mtx(10, 10);

    var pieces = [
        // 1: 1x1
        {t:1, f:4, p:[[0,0]]},
        // 2: 2x1
        {t:2, f:2, p:[[0,0], [0,1]]},
        {t:2, f:2, p:[[0,0], [1,0]]},
        // 3: 3x1
        {t:3, f:2, p:[[0,0], [1,0], [2,0]]},
        {t:3, f:2, p:[[0,0], [0,1], [0,2]]},
        // 4: 2x2 L
        {t:4, f:1, p:[[0,0], [0,1], [1,0]]},
        {t:4, f:1, p:[[0,0], [1,0], [1,1]]},
        {t:4, f:1, p:[[0,1], [1,0], [1,1]]},
        {t:4, f:1, p:[[0,0], [0,1], [1,1]]},
        // 5: 4x1
        {t:5, f:2, p:[[0,0], [0,1], [0,2], [0,3]]},
        {t:5, f:2, p:[[0,0], [1,0], [2,0], [3,0]]},
        // 6: 2x2 square
        {t:6, f:4, p:[[0,0], [0,1], [1,0], [1,1]]},
        // 7: 5x1
        {t:7, f:2, p:[[0,0], [0,1], [0,2], [0,3], [0,4]]},
        {t:7, f:2, p:[[0,0], [1,0], [2,0], [3,0], [4,0]]},
        // 8: 3x3 square
        {t:8, f:4, p:[[0,0], [0,1], [0,2], [1,0], [1,1], [1,2], [2,0], [2,1], [2,2]]},
        // 9: 3x3 L
        {t:9, f:1, p:[[2,0], [1,0], [0,0], [0,1], [0,2]]},
        {t:9, f:1, p:[[0,0], [1,0], [2,0], [2,1], [2,2]]},
        {t:9, f:1, p:[[0,0], [0,1], [0,2], [1,2], [2,2]]},
        {t:9, f:1, p:[[2,0], [2,1], [2,2], [1,2], [0,2]]}
    ];



    var totalOdds = pieces.reduce(function(prev, curr) {
        return prev + curr.f;
    }, 0);



    var rndPiece = function() {
        var i = rnd(totalOdds);
        var p, accum = 0;
        for (var idx = 0; ; ++idx) {
            p = pieces[idx];
            accum += p.f;
            if (i < accum) {
                return p;
            }
        }
    };



    var l = 10;
    var L = 9.5;
    var R = 1;
    var s;

    var LS_KEY = 'ten_by_ten_high_score';

    var slotY = 100 + 50*0.25;
    var slotXs = seq(3).map(function(i) { return (i+0.5)*0.33333*100; });

    var gap = hasTouch() ? -2*10 : 0; // finger gap so you can see the piece while dragging

    var piecesInSlots = [,,];



    var measurePiece = function(p) {
        var dims = [0, 0];
        p.p.forEach(function(pos) {
            if (pos[0] > dims[0]) { dims[0] = pos[0]; }
            if (pos[1] > dims[1]) { dims[1] = pos[1]; }
        });
        return [dims[0]+1, dims[1]+1];
    };



    var doesPieceFit = function(p, pos) {
        for (var i = 0, I = p.p.length, pp, x, y, v; i < I; ++i) {
            pp = p.p[i];
            x = pos[0] + pp[0];
            y = pos[1] + pp[1];
            if (x < 0 || y < 0 || x > 9 || y > 9) { return false; }
            v = m.get(x, y);
            if (v.v !== 0) { return false; }
        }
        return true;
    };



    var findLines = function() {
        var lines = [];
        seq(2).forEach(function(axis) {
            seq(10).forEach(function(i) {
                var line = [];
                var wasLine = seq(10).every(function(j) {
                    var x = (axis === 0) ? i : j;
                    var y = (axis === 1) ? i : j;
                    var filled = m.get(x, y).v !== 0;
                    if (filled) {
                        line.push([x, y]);
                    }
                    return filled;
                });
                if (wasLine) {
                    lines.push(line);
                }
            });
        });
        return lines;
    };



    var isGameOver = function() {
        //console.log('---');
        return piecesInSlots.every(function(p/*, slot*/) {
            if (!p) { return true; }
            return seq(10).every(function(y) {
                return seq(10).every(function(x) {
                    var didItFit = doesPieceFit(p, [x, y]);
                    /*if (didItFit) {
                     console.log('slot #:%d -> pos:[%d,%d]', slot, x, y);
                     }*/
                    return !didItFit;
                });
            });
        });
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



    var updateScore = function(scoreAdd) {
        score += scoreAdd;

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



    var setPiece = function(p, delta) {
        p.p.forEach(function(pos) {
            var o = m.get(pos[0] + delta[0], pos[1] + delta[1]);
            o.r.attr('class', 'fill-' + p.t);
            o.v = p.t;
        });
    };



    var reset = function() {
        score = 0;
        updateScore(0);

        seq(10).forEach(function(y) {
            seq(10).forEach(function(x) {
                var v = m.get(x, y);
                v.v = 0;
                v.r.attr('class', 'fill-0');
            });
        });
        seq(3).forEach(function(slot) {
            var p = piecesInSlots[slot];
            if (!p) {
                createPiece(rndPiece(), slot);
            }
        });
    };



    var createPiece = function(p, slot) {
        piecesInSlots[slot] = p;

        var g = s.group();
        g.addClass('in-slot-' + slot);
        var dims = measurePiece(p);

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
                //console.log('end', pos2);

                var didItFit = doesPieceFit(p, pos2);

                var slot = parseInt( g.attr('class').substring(8), 10);

                if (didItFit) { // it does -> setPiece
                    updateScore(p.p.length);

                    setPiece(p, pos2);
                    g.remove();
                    piecesInSlots[slot] = undefined;

                    if (false) { // easier
                        createPiece(rndPiece(), slot);
                    }
                    else { // standard
                        if (!piecesInSlots[0] && !piecesInSlots[1] && !piecesInSlots[2]) {
                            createPiece(rndPiece(), 0);
                            createPiece(rndPiece(), 1);
                            createPiece(rndPiece(), 2);
                        }
                    }

                    var lines = findLines();
                    //console.log('lines', lines);

                    if (lines.length > 0) { // lines occurred -> find positions and animate then to gray
                        var positions = mergeArrays(lines);
                        positions = uniques(positions, posFormatter);
                        //console.log('positions', positions);

                        updateScore(positions.length);

                        positions.forEach(function(pos) {
                            var v = m.get(pos[0], pos[1]);
                            v.v = 0;
                            v.r.attr('class', 'fill-0');
                        });
                    }

                    if (isGameOver()) {
                        alert('game over', reset);
                    }
                }
                else { // it does not -> reset piece
                    g.remove();
                    createPiece(p, slot);
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
    seq(10).forEach(function(y) {
        seq(10).forEach(function(x) {
            var r = s.rect(x*l, y*l, L, L, R, R);
            mtxG.add(r);
            r.attr('class', 'fill-0');
            m.set(x, y, {v:0, r:r});
        });
    });



    // populate slots
    createPiece(rndPiece(), 0);
    createPiece(rndPiece(), 1);
    createPiece(rndPiece(), 2);



    // load hight score
    highScore = loadHighScore();
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
        g.drag(noop, function() {
            var theme = document.documentElement.className;
            theme = (theme === 'dark') ? 'light' : 'dark';
            document.documentElement.className = theme;
        }, noop);
    })();



    // begin to capture the initial click to FS
    alert('begin', function() {});

})();
