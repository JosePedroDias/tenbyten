(function() {
    'use strict';

    var c = window.common();
    //var c = window.common(true, 42);

    var SERVER = 'http://stage.sl.pt:3000';
    //var SERVER = 'http://127.0.0.1:3000';



    var ajax = function(o) {
        var xhr = new XMLHttpRequest();
        xhr.open(o.method || 'GET', o.uri, true);
        var cbInner = function() {
            if (xhr.readyState === 4 && xhr.status > 199 && xhr.status < 300) {
                return o.cb(null, JSON.parse(xhr.response));
            }
            o.cb('error requesting ' + o.uri);
        };
        xhr.onload  = cbInner;
        xhr.onerror = cbInner;
        xhr.send(o.payload || null);
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



    var loadItem = function(key, defVal) {
        try {
            var v = localStorage.getItem(key);
            var v2 = parseFloat(v);
            return (isFinite(v2) ? v2 : v);
        } catch (ex) {
            return defVal;
        }
    };



    var saveItem = function(key, val) {
        try {
            localStorage.setItem(key, val);
        } catch (ex) {}
    };



    var l = 10;
    var L = 9.5;
    var R = 1;
    var LS_HIGHSCORE = 'ten_by_ten_high_score';
    var LS_NAME = 'ten_by_ten_name';
    var LS_EMAIL = 'ten_by_ten_email';
    var slotY = 100 + 50*0.25;
    var slotXs = c.seq(3).map(function(i) { return (i+0.5)*0.33333*100; });
    var HAS_TOUCH = hasTouch();
    var gap = HAS_TOUCH ? -2*10 : 0; // finger gap so you can see the piece while dragging

    var s;
    var sSlots = new Array(3);
    var sMatrix = c.mtx(10, 10);

    var st;
    var highScore = loadItem(LS_HIGHSCORE, 0);



    var updateScore = function() {
        var score = st.score;

        if (score > highScore) {
            highScore = score;
            saveItem(LS_HIGHSCORE, highScore);
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
        g.attr('opacity', 0);
        g.addClass('alert');

        var r = s.rect(-5, -10, 110, 140);
        r.attr('fill', 'fill-0');
        r.attr('opacity', 0.75);
        g.add(r);

        if (msg) {
            var t = s.text(50, 60, msg);
            t.attr('text-anchor', 'middle');
            g.addClass('score'); //ugly
            g.add(t);
        }

        var onClick = function() {
            g.animate({opacity:0}, 500, mina.easeinout, function() {
                g.remove();
                if (cb) { cb(); }
            });
        };

        g.node.addEventListener('mousedown',  onClick);
        g.node.addEventListener('touchstart', onClick);

        g.animate({opacity:1}, 500, mina.easeinout);

        return g;
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
        ajax({
            uri: [SERVER, 'new-game'].join('/'),
            cb: function(err, o) {
                //if (err) { return alert(err); }
                if (err) { return alert('server down?'); }
                if (o.err) { return alert(o.err); }

                st = enrichFirstState(o);

                updateScore(0);

                updateFromMatrix();

                c.seq(3).forEach(function(i) {
                    if (sSlots[i]) {
                        sSlots[i].remove();
                        sSlots[i] = undefined;
                    }
                });

                checkSlots();
            }
        });
    };



    var enrichFirstState = function(st) {
        st.slots = st.slots.map(function (pieceIdx) {
            return c.PIECES[pieceIdx];
        });

        st.m = c.mtx(10, 10);
        c.seq(10).forEach(function(y) {
            c.seq(10).forEach(function(x) {
                st.m.set(x, y, 0);
            });
        });

        //console.log(st);
        return st;
    };



    var enrichPlayState = function(st, srvSt, slot, pos) {
        var p = st.slots[slot];
        var m = st.m;

        st = srvSt;
        c.setPiece(p, pos, m);

        st.slots = srvSt.slots.map(function (pieceIdx) {
            return ( (pieceIdx === false) ? undefined : c.PIECES[pieceIdx] );
        });

        c.processLines(m)

        st.m = m;

        //console.log(st);
        return st;
    };



    var nth = function(n) {
        var th = 'th';
        if (n === 1) { th = 'st'; }
        else if (n === 2) { th = 'nd'; }
        else if (n === 3) { th = 'rd'; }
        return n + th;
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

                ajax({
                    uri: [SERVER, 'play', st.id, st.step, slot, pos2[0], pos2[1]].join('/'),
                    cb: function(err, o) {
                        //if (err) { return alert(err); }
                        if (err) { return alert('server down?'); }

                        //if (o.err) { alert(o.err); }

                        g.remove();
                        sSlots[slot] = undefined;

                        if ('err' in o) {
                            var p = st.slots[slot];
                            createPiece(p, slot);
                        }
                        else {
                            st = enrichPlayState(st, o, slot, pos2);

                            updateScore(st.score);
                            updateFromMatrix();

                            if (st.ended) {
                                alert('game over', function() {
                                    var name = loadItem(LS_NAME, '');
                                    var email = loadItem(LS_EMAIL, '');

                                    do { name  = window.prompt('name?',  name);  } while (!name.trim());
                                    do { email = window.prompt('email?', email); } while (!email.trim());

                                    name = name.trim();
                                    email = email.trim();

                                    saveItem(LS_NAME, name);
                                    saveItem(LS_EMAIL, email);

                                    ajax({
                                        uri: [SERVER, 'highscore', st.id, encodeURIComponent(email), encodeURIComponent(name)].join('/'),
                                        cb: function(err, o) {
                                            //if (err) { return alert(err); }
                                            if (err) { return alert('server down?'); }

                                            if (o.err) { alert(o.err); }

                                            alert([nth(o.rank+1), ' with ', st.score, ' points'].join(''), reset);
                                        }
                                    })
                                });
                            }
                            else {
                                checkSlots();
                            }
                        }
                    }
                });
            }
        );

        return g;
    };



    // http://snapsvg.io/docs

    s = Snap('svg');
    s.select('desc').remove();



    // setup scores
    (function() {
        var sc = s.text(25, -2, 0);
        sc.attr('text-anchor', 'middle');
        sc.addClass('score');

        var hsc = s.text(75, -2, highScore);
        hsc.attr('text-anchor', 'middle');
        hsc.addClass('high-score');

        hsc.click(function() {
            var y0 = 10;
            ajax({
                uri: [SERVER, 'highscores'].join('/'),
                cb: function(err, o) {
                    if (err) { return; }

                    var g = alert(o.length === 0 ? 'no highscores yet' : undefined);

                    c.seq(10).forEach(function(idx) {
                        var line = o[idx];
                        if (!line) { return; }
                        //var line = {name:'toni', score:12312, email:'jose.pedro.dias@gmail.com'};

                        var lineText = [line.score, ' - ', line.name].join('');
                        var imgSrc = getGravatar(line.email, 80);

                        var t = s.text(20, y0+10*idx, lineText);
                        t.addClass('score');
                        g.add(t);

                        var img = s.image(imgSrc, 10, y0+10*idx-7.5, 8, 8);
                        g.add(img);
                    });
                }
            });
        });
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
    if (HAS_TOUCH) {
        s.node.addEventListener('mousedown',  setFullScreen);
        s.node.addEventListener('touchstart', setFullScreen);
    }



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
    alert('begin', reset);

})();
