(function() {
    'use strict';

    var c = window.common();
    //var c = window.common(true, 42);

    var SERVER = 'http://stage.sl.pt:3000';
    //var SERVER = 'http://127.0.0.1:3000';



    var sfx = jsfx.Sounds({"piece":{"Frequency":{"Start":139,"Min":397.1684554964304,"Slide":-0.8417304918635636,"Max":787},"Generator":{"Func":"sine","A":0.666447072965093,"ASlide":0.09330859859474003},"Phaser":{"Offset":0.1686953672207892,"Sweep":0.1867293302435428},"Volume":{"Sustain":0.05,"Decay":0.07,"Punch":1.06,"Attack":0.01,"Master":0.64}},"denied":{"Frequency":{"Start":439,"Slide":-0.83,"Max":1800,"Min":30,"ChangeSpeed":0,"DeltaSlide":0.2},"Generator":{"Func":"string","A":0.26,"B":0,"ASlide":0},"Filter":{"HP":0.15,"LP":1,"LPSlide":0.01,"LPResonance":0,"HPSlide":-0.41},"Volume":{"Sustain":0.2,"Decay":0.24,"Punch":0.24,"Master":0.52},"Vibrato":{"Depth":0},"Phaser":{"Offset":0.01}},"more":{"Frequency":{"Start":660,"Slide":0.51,"Max":1800,"DeltaSlide":-0.26},"Generator":{"Func":"synth","BSlide":0.17,"ASlide":-0.43},"Phaser":{"Offset":0.5935326264007017,"Sweep":-0.12729871559422462},"Volume":{"Sustain":0.19,"Decay":0.33,"Punch":0.43},"Vibrato":{"Depth":0.06,"Frequency":35.01,"DepthSlide":-0.31,"FrequencySlide":-0.2},"Filter":{"LPSlide":-0.1,"LPResonance":0.19,"HP":0.82}},"line":{"Frequency":{"Start":73,"Min":1362,"Max":1769.8050347110257,"Slide":0.31,"DeltaSlide":-0.31,"RepeatSpeed":0.32,"ChangeAmount":-5,"ChangeSpeed":0.43},"Vibrato":{"Depth":0.24,"DepthSlide":-0.68,"Frequency":14.01,"FrequencySlide":0.26},"Generator":{"Func":"string","A":0.6544020092114806,"B":0.6996062810067087,"ASlide":0.9439933458343148,"BSlide":-0.8408931125886738},"Guitar":{"A":0.4469512205105275,"B":0.4436649903655052,"C":0.3948096898384392},"Phaser":{"Offset":0.9750056094489992,"Sweep":0.02325455006211996},"Volume":{"Master":0.64,"Attack":0.08,"Sustain":0.25,"Punch":0.58,"Decay":0.85},"Filter":{"HP":0,"LPResonance":0}},"start":{"Frequency":{"Start":630.3844311484136,"Min":1380.6388479773887,"Max":193.86719992384315,"Slide":-0.3229934247210622,"DeltaSlide":-0.6038368884474039,"RepeatSpeed":1.1204902755562216,"ChangeAmount":-10.367714105173945,"ChangeSpeed":0.2946239020675421},"Vibrato":{"Depth":0.9577971468679607,"DepthSlide":-0.7794344457797706,"Frequency":25.28196069442202,"FrequencySlide":0.1149409250356257},"Generator":{"Func":"sine","A":0.8635227780323476,"B":0.15138676925562322,"ASlide":0.3261460131034255,"BSlide":-0.5880415849387646},"Guitar":{"A":0.9728574715554714,"B":0.6253615105524659,"C":0.34530656365677714},"Phaser":{"Offset":0.4403600045479834,"Sweep":0.38121403893455863},"Volume":{"Master":0.4,"Attack":0.2446278550196439,"Sustain":1.1377039570361376,"Punch":1.1716240528039634,"Decay":0.9491019332781434}}});



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
            if (v === null) { return defVal; }
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
    var LS_THEME_LIGHT = 'ten_by_ten_theme_light';
    var slotY = 100 + 50*0.25;
    var slotXs = c.seq(3).map(function(i) { return (i+0.5)*0.33333*100; });
    var HAS_TOUCH = hasTouch();
    var gap = HAS_TOUCH ? -2*10 : 0; // finger gap so you can see the piece while dragging

    var s;
    var sSlots = new Array(3);
    var sMatrix = c.mtx(10, 10);

    var st;
    var highScore = loadItem(LS_HIGHSCORE, 0);
    var themeLight = loadItem(LS_THEME_LIGHT, 0);



    var animateText = function(selector, val) {
        var sc = s.select(selector);
        sc.attr('fontSize', 8);
        sc.animate({fontSize:2, opacity:0}, 150, mina.linear, function() {
            sc.attr('text', val);
            sc.animate({fontSize:8, opacity:1}, 150);
        });
    };



    var updateScore = function() {
        var score = st.score;

        if (score > highScore) {
            highScore = score;
            saveItem(LS_HIGHSCORE, highScore);
            updateHighScore(highScore);
        }

        animateText('.score', score);
    };



    var updateHighScore = function(highScore) {
        animateText('.high-score', highScore);
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



    var pingpong = function(i) {
        //i = mina.easeinout(i);
        return (i < 0.5) ? 2*i : 1 - 2*(i-0.5) ;
    };

    var updateFromState = function() {
        if (st.addedPieces) {
            st.addedPieces.forEach(function(pos) {
                var r = sMatrix.get(pos[0], pos[1]);
                r.attr('class', 'fill-' + st.pieceType);
            });
        }

        if (st.removedPieces) {
            st.removedPieces.forEach(function(pos) {
                var x = pos[0];
                var y = pos[1];
                var v = st.m.get(x, y);
                var r = sMatrix.get(x, y);
                r.attr('class', 'fill-' + v);

                r.animate({
                    opacity: 0,
                    width: 0,
                    height: 0,
                    x: x*10+4.25,
                    y: y*10+4.25
                }, 400, pingpong);
            });
        }
        else {
            c.seq(10).forEach(function(y) {
                c.seq(10).forEach(function (x) {
                    var v = st.m.get(x, y);
                    var r = sMatrix.get(x, y);
                    r.attr('class', 'fill-' + v);
                });
            });
        }
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

                sfx.start();

                st = enrichFirstState(o);

                updateScore(0);

                updateFromState();

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

        delete st.addedPieces;
        delete st.removedPieces;

        //console.log(st);
        return st;
    };



    var enrichPlayState = function(st, srvSt, slot, pos) {
        var slotsRenewed = false;
        if (!sSlots[0] && !sSlots[1] && !sSlots[2]) {
            slotsRenewed = true;
            /*setTimeout(function() {
                s.selectAll('.in-slot-0,.in-slot-1,.in-slot-2').animate({opacity:1}, 300); TODO
                sfx.more();
            }, 400);*/
        }

        var p = st.slots[slot];
        var m = st.m;

        st = srvSt;

        st.pieceType = p.t;
        st.addedPieces = c.setPiece(p, pos, m);

        st.slots = srvSt.slots.map(function (pieceIdx) {
            return ( (pieceIdx === false) ? undefined : c.PIECES[pieceIdx] );
        });

        st.removedPieces = c.processLines(m, true);

        st.m = m;

        st.slotsRenewed = slotsRenewed;

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

                        if (o.err) {
                            //alert(o.err);
                            sfx.denied();
                        }

                        g.remove();
                        sSlots[slot] = undefined;

                        if ('err' in o) {
                            var p = st.slots[slot];
                            createPiece(p, slot);
                        }
                        else {
                            st = enrichPlayState(st, o, slot, pos2);

                            if (st.removedPieces.length > 0) {
                                sfx.line();
                            }
                            else {
                                sfx.piece();
                            }

                            updateScore(st.score);
                            updateFromState();

                            if (st.slotsRenewed) {
                                //s.selectAll('.in-slot-0,.in-slot-1,.in-slot-2').attr('opacity', 0); TODO
                            }

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

                        var t = s.text(10, y0+10*idx-0.9, lineText);
                        g.add(t);

                        var img = s.image(imgSrc, 0, y0+10*idx-7.5, 8, 8);
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
    var toggleTheme = function() {
        themeLight = themeLight ? 0 : 1;
        saveItem(LS_THEME_LIGHT, themeLight);
        document.documentElement.className = (themeLight ? 'light' : 'dark');
    };

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
        g.drag(c.noop, toggleTheme, c.noop);

        if (themeLight) {
            document.documentElement.className = 'light';
        }
    })();



    // begin to capture the initial click to FS
    alert('begin', reset);

})();
