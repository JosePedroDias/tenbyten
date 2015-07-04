(function() {
    'use strict';

    var c = window.common();
    //var c = window.common(true, 42);

    var noop = function() {};

    var SERVER = 'http://stage.sl.pt:3000';
    //var SERVER = 'http://127.0.0.1:3000';


    var sfx;
    var sfxLib = {"piece":{"Frequency":{"Start":139,"Min":397.1684554964304,"Slide":-0.8417304918635636,"Max":787},"Generator":{"Func":"sine","A":0.666447072965093,"ASlide":0.09330859859474003},"Phaser":{"Offset":0.1686953672207892,"Sweep":0.1867293302435428},"Volume":{"Sustain":0.05,"Decay":0.07,"Punch":1.06,"Attack":0.01,"Master":0.64}},"denied":{"Frequency":{"Start":439,"Slide":-0.83,"Max":1800,"Min":30,"ChangeSpeed":0,"DeltaSlide":0.2},"Generator":{"Func":"string","A":0.26,"B":0,"ASlide":0},"Filter":{"HP":0.15,"LP":1,"LPSlide":0.01,"LPResonance":0,"HPSlide":-0.41},"Volume":{"Sustain":0.2,"Decay":0.24,"Punch":0.24,"Master":0.52},"Vibrato":{"Depth":0},"Phaser":{"Offset":0.01}},"more":{"Frequency":{"Start":660,"Slide":0.51,"Max":1800,"DeltaSlide":-0.26},"Generator":{"Func":"synth","BSlide":0.17,"ASlide":-0.43},"Phaser":{"Offset":0.5935326264007017,"Sweep":-0.12729871559422462},"Volume":{"Sustain":0.19,"Decay":0.33,"Punch":0.43},"Vibrato":{"Depth":0.06,"Frequency":35.01,"DepthSlide":-0.31,"FrequencySlide":-0.2},"Filter":{"LPSlide":-0.1,"LPResonance":0.19,"HP":0.82}},"line":{"Frequency":{"Start":73,"Min":1362,"Max":1769.8050347110257,"Slide":0.31,"DeltaSlide":-0.31,"RepeatSpeed":0.32,"ChangeAmount":-5,"ChangeSpeed":0.43},"Vibrato":{"Depth":0.24,"DepthSlide":-0.68,"Frequency":14.01,"FrequencySlide":0.26},"Generator":{"Func":"string","A":0.6544020092114806,"B":0.6996062810067087,"ASlide":0.9439933458343148,"BSlide":-0.8408931125886738},"Guitar":{"A":0.4469512205105275,"B":0.4436649903655052,"C":0.3948096898384392},"Phaser":{"Offset":0.9750056094489992,"Sweep":0.02325455006211996},"Volume":{"Master":0.64,"Attack":0.08,"Sustain":0.25,"Punch":0.58,"Decay":0.85},"Filter":{"HP":0,"LPResonance":0}},"start":{"Frequency":{"Start":630.3844311484136,"Min":1380.6388479773887,"Max":193.86719992384315,"Slide":-0.3229934247210622,"DeltaSlide":-0.6038368884474039,"RepeatSpeed":1.1204902755562216,"ChangeAmount":-10.367714105173945,"ChangeSpeed":0.2946239020675421},"Vibrato":{"Depth":0.9577971468679607,"DepthSlide":-0.7794344457797706,"Frequency":25.28196069442202,"FrequencySlide":0.1149409250356257},"Generator":{"Func":"sine","A":0.8635227780323476,"B":0.15138676925562322,"ASlide":0.3261460131034255,"BSlide":-0.5880415849387646},"Guitar":{"A":0.9728574715554714,"B":0.6253615105524659,"C":0.34530656365677714},"Phaser":{"Offset":0.4403600045479834,"Sweep":0.38121403893455863},"Volume":{"Master":0.4,"Attack":0.2446278550196439,"Sustain":1.1377039570361376,"Punch":1.1716240528039634,"Decay":0.9491019332781434}}};
    var setupSfx = function(activated) {
        sfx = activated ? jsfx.Sounds(sfxLib) : {piece:noop, line:noop, start:noop, denied:noop, more:noop()};
    };



    var ajax = function ajax(o) {
        var xhr = new XMLHttpRequest();
        xhr.open(o.method || 'GET', o.uri, true);
        var cbInner = function() {
            if (xhr.readyState === 4 && xhr.status > 199 && xhr.status < 300) {
                return o.cb(null, JSON.parse(xhr.response));
            }
            o.cb('error requesting ' + o.uri, function() { // on error, 2nd argument becomes optional retry function
                ajax(o);
            });
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
    var LS_SFX_ON = 'ten_by_ten_sfx_on';
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
    var sfxOn = loadItem(LS_SFX_ON, 0);

    // toggle theme and sfx
    var updateToggleRootClasses = function() {
        var classes = [];
        if (themeLight) { classes.push('light'); }
        if (sfxOn) { classes.push('sfx'); }
        document.documentElement.className = classes.join(' ');
    };

    setupSfx(sfxOn);
    updateToggleRootClasses();



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
                if (cb) { cb(); cb = undefined; }
            });
        };

        g.node.addEventListener('mousedown',  onClick);
        g.node.addEventListener('touchstart', onClick);

        g.animate({opacity:1}, 500, mina.easeinout);

        return g;
    };



    // auxiliary alert to capture input and display ajax state
    var roundtrip = function() {
        //console.log('roundtrip starting...');

        var g = s.group();
        g.attr('opacity', 0);
        g.addClass('alert');

        var r = s.rect(-5, -10, 110, 140);
        r.attr('fill', 'fill-0');
        r.attr('opacity', 0.75);
        g.add(r);

        var t = s.text(50, 60, 'sending...');
        t.attr('text-anchor', 'middle');
        g.add(t);

        var setText = function(msg) {
            t.attr('text', msg);
        };

        var state = 0; // 0=waiting, 1=ok, 2=failed

        var onDone = function(cb) {
            g.animate({opacity:0}, 500, mina.easeinout, function() {
                g.remove();
                //console.log('roundtrip done');
                if (cb) { cb(); cb = undefined; }
            });
        };
        var cbFailed;
        var onClick = function() {
            if (state === 2) {
                onDone();
                if (cbFailed) { cbFailed(); cbFailed = undefined; }
                state = 0;
            }
        };

        g.node.addEventListener('mousedown',  onClick);
        g.node.addEventListener('touchstart', onClick);

        g.animate({opacity:1}, 500, mina.easeinout);

        return {
            ok: function(cb) {
                state = 1;
                //console.log('ok');
                setText('ok.');
                onDone(cb);
            },
            failed: function(cb) {
                state = 2;
                //console.log('failed! retry?');
                setText('failed! retry?');
                cbFailed = cb;
            }
        }
    };


    // ajax using roundtrip to display state and trigger retry if failed
    var ajax2 = function(oo) {
        var rt = roundtrip();

        ajax({
            uri: oo.uri,
            cb: function (err, o) {
                if (err) {
                    return rt.failed(function () {
                        rt = roundtrip();
                        o();
                    });
                }
                else {
                    rt.ok();
                    oo.cb(err, o);
                }
            }
        });
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
        ajax2({
            uri: [SERVER, 'new-game'].join('/'),
            cb: function(err, o) {
                //if (err) { return alert(err); }
                //if (err) { return alert('server down?'); }
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

                ajax2({
                    uri: [SERVER, 'play', st.id, st.step, slot, pos2[0], pos2[1]].join('/'),
                    cb: function(err, o) {
                        //if (err) { return alert(err); }
                        //if (err) { return alert('server down?'); }

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

                                    ajax2({
                                        uri: [SERVER, 'highscore', st.id, encodeURIComponent(email), encodeURIComponent(name)].join('/'),
                                        cb: function(err, o) {
                                            if (err) { return alert(err); }
                                            //if (err) { return alert('server down?'); }

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
            ajax2({
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



    var toggleTheme = function() {
        themeLight = themeLight ? 0 : 1;
        saveItem(LS_THEME_LIGHT, themeLight);
        updateToggleRootClasses();
    };

    var toggleSfx = function() {
        sfxOn = sfxOn ? 0 : 1;
        saveItem(LS_SFX_ON, sfxOn);
        setupSfx(sfxOn);
        updateToggleRootClasses();
    };

    // toggle buttons
    (function() {
        // icon paths
        var themeDay = 'm 1.3773306,1048.9242 c 0.038524,0.039 0.1009774,0.039 0.1394961,0 l 0.1220616,-0.1221 c 0.038529,-0.039 0.038529,-0.1009 0,-0.1395 l -0.4289589,-0.4289 c -0.038524,-0.038 -0.1009774,-0.038 -0.1394962,0 l -0.12206153,0.122 c -0.0385237,0.039 -0.0385237,0.101 0,0.1395 l 0.42895893,0.429 z m -0.1673963,2.4865 0.428959,-0.4289 c 0.038529,-0.039 0.038529,-0.101 0,-0.1395 l -0.1220616,-0.1221 c -0.038524,-0.038 -0.1009774,-0.038 -0.1394961,0 l -0.428959,0.429 c -0.0385237,0.038 -0.0385237,0.101 0,0.1395 l 0.1220616,0.122 c 0.038519,0.039 0.1009724,0.039 0.1394961,0 z m 2.793434,0 0.1220616,-0.122 c 0.038524,-0.039 0.038524,-0.101 0,-0.1395 l -0.428959,-0.429 c -0.038529,-0.038 -0.1009823,-0.038 -0.1394961,0 l -0.1220616,0.1221 c -0.038529,0.038 -0.038529,0.101 0,0.1395 l 0.428959,0.4289 c 0.038524,0.039 0.1009773,0.039 0.1394961,0 z m -0.4463886,-2.4865 c 0.038524,0.039 0.1009774,0.039 0.1394962,0 l 0.4289589,-0.429 c 0.038524,-0.039 0.038524,-0.1009 0,-0.1395 l -0.1220616,-0.122 c -0.038524,-0.038 -0.1009773,-0.038 -0.1394961,0 l -0.4289589,0.4289 c -0.038529,0.039 -0.038529,0.101 0,0.1395 l 0.1220615,0.1221 z m -3.0816441,1.083 h 0.6066335 c 0.054479,0 0.09864,-0.044 0.09864,-0.099 v -0.1726 c 0,-0.054 -0.044161,-0.099 -0.09864,-0.099 H 0.4753356 c -0.0544787,0 -0.0986396,0.044 -0.0986396,0.099 v 0.1726 c 0,0.054 0.044161,0.099 0.0986396,0.099 z m 2.1478773,1.9752 c 0.054479,0 0.09864,-0.044 0.09864,-0.099 v -0.6067 c 0,-0.054 -0.044161,-0.099 -0.09864,-0.099 H 2.4505936 c -0.054479,0 -0.09864,0.044 -0.09864,0.099 v 0.6067 c 0,0.054 0.044161,0.099 0.09864,0.099 h 0.1726193 z m 1.2699848,-2.2465 v 0.1726 c 0,0.054 0.044161,0.099 0.09864,0.099 h 0.6066336 c 0.054479,0 0.09864,-0.044 0.09864,-0.099 v -0.1726 c 0,-0.054 -0.044161,-0.099 -0.09864,-0.099 h -0.606634 c -0.054479,0 -0.09864,0.044 -0.09864,0.099 z m -1.4426041,-1.27 h 0.1726193 c 0.054479,0 0.09864,-0.044 0.09864,-0.099 v -0.6067 c 0,-0.054 -0.044161,-0.099 -0.09864,-0.099 H 2.4505936 c -0.054479,0 -0.09864,0.044 -0.09864,0.099 v 0.6067 c 0,0.055 0.044161,0.099 0.09864,0.099 z m 1.2995767,1.3563 c 0,0.6701 -0.5431981,1.2133 -1.2132671,1.2133 -0.6700689,0 -1.213267,-0.5432 -1.213267,-1.2133 0,-0.6701 0.5431981,-1.2133 1.213267,-1.2133 0.670069,0 1.2132671,0.5432 1.2132671,1.2133 z';
        var themeNight = 'm 4.1598469,1051.4229 c 0.2996763,-0.2996 0.4951705,-0.664 0.5865734,-1.0481 0.026175,-0.11 -0.1090452,-0.1843 -0.1888156,-0.1042 -9.793e-4,10e-4 -0.00196,0 -0.00294,0 -0.6667594,0.6667 -1.7557838,0.6539 -2.4062623,-0.039 -0.6132543,-0.6528 -0.6052047,-1.6664 0.017547,-2.3101 0.00785,-0.01 0.015765,-0.016 0.023743,-0.024 0.07999,-0.079 0.00523,-0.2141 -0.1044735,-0.188 -0.3806935,0.091 -0.7420296,0.2832 -1.040244,0.5782 -0.87193231,0.8627 -0.87684331,2.2613 -0.010725,3.1298 0.86233,0.8646 2.2623575,0.8654 3.1255952,0 z';
        var sfxOff = 'm 0.30091792,1050.1525 a 0.15215478,0.15215478 0 1 1 0.015783,-0.3039 l 4.38384088,0 a 0.15200762,0.15200762 0 1 1 0,0.3039 l -4.38384088,0 a 0.15200762,0.15200762 0 0 1 -0.015783,0 z';
        var sfxOn = 'm 3.786504,1050.0102 c 0.024309,0.065 0.086482,0.1084 0.1560268,0.1084 h 0.7322896 c 0.091892,0 0.1665269,-0.074 0.1665269,-0.1665 0,-0.092 -0.074635,-0.1665 -0.1665269,-0.1665 H 4.0581376 l -0.3317386,-0.8905 c -0.023715,-0.064 -0.084075,-0.1066 -0.1520388,-0.1083 -0.068463,0 -0.1302645,0.038 -0.1570874,0.1008 l -0.2994747,0.6986 -0.3874631,-1.4441 c -0.019982,-0.075 -0.090057,-0.1266 -0.166792,-0.1232 -0.07752,0 -0.1428752,0.059 -0.1575329,0.1349 l -0.4635197,2.407 -0.3285567,-1.2992 c -0.017903,-0.071 -0.079482,-0.1214 -0.1521873,-0.1255 -0.073172,0 -0.139651,0.04 -0.1652117,0.1078 l -0.2387016,0.6366 H 0.42844413 c -0.0919976,0 -0.16650563,0.074 -0.16650563,0.1665 0,0.092 0.0745081,0.1665 0.16650563,0.1665 H 1.1731429 c 0.069428,0 0.1315479,-0.043 0.1559526,-0.1081 l 0.092337,-0.2463 0.3814177,1.5088 c 0.018805,0.074 0.085454,0.1258 0.1613617,0.1258 0.00165,0 0.00326,0 0.00491,-10e-5 0.078019,0 0.143957,-0.058 0.1587313,-0.135 l 0.4682607,-2.4313 0.3246748,1.2093 c 0.018359,0.069 0.07804,0.1179 0.1489737,0.123 0.069587,0 0.136904,-0.035 0.1647875,-0.1005 l 0.3248551,-0.758 0.2270985,0.6091 z';

        var makeToggleButton = function(buttonClass, offPath, offClass, onPath, onClass, pos, toggleFn) {
            var g = s.group();
            g.addClass(buttonClass);
            var r = s.rect(pos[0], pos[1], 10, 10, 5, 5);
            r.addClass('fill-0');
            g.add(r);

            var p = s.path(offPath);
            p.transform(
                Snap
                    .matrix()
                    .translate(pos[0], pos[1])
                    .scale(1.6, 1.6)
                    .translate(0.5, 0.5)
                    .translate(0, -1047.3622)
                    .toTransformString()
            );
            //p.addClass('fill-0');
            p.addClass(offClass);
            g.add(p);

            p = s.path(onPath);
            p.transform(
                Snap.matrix()
                    .translate(pos[0], pos[1])
                    .scale(1.6, 1.6)
                    .translate(0.5, 0.5)
                    .translate(0, -1047.3622)
                    .toTransformString()
            );
            //p.addClass('fill-0');
            p.addClass(onClass);
            g.add(p);

            g.drag(c.noop, toggleFn, c.noop);

            //console.log( p.node.getBoundingClientRect() );
        };

        makeToggleButton('toggle-theme', themeNight, 'theme-light-off', themeDay, 'theme-light-on', [40, -10], toggleTheme);
        makeToggleButton('toggle-sfx', sfxOff, 'sfx-off', sfxOn, 'sfx-on', [50, -10], toggleSfx);

    })();



    // credits
    (function() {
        s   .text(50, 130-2, 'developed in 2015 by José Pedro Dias')
            .attr('text-anchor', 'middle')
            .addClass('credits')
            .addClass('fill-0');

        var b=s .path('m 93,-10 l 6,0 l 6,6 l 0,6 z'); //12x12 (105-12)

        var c=s   .text(0, 0, 'fork me')
            .attr('text-anchor', 'middle')
            .attr('font-size', 2.5)
            .attr('opacity', 0.75)
            .addClass('credits')
            .addClass('fill-0')
            .transform(
                Snap.matrix()
                    .translate(93+6, -10+6)
                    .translate(0.7, -0.7)
                    .rotate(45)
                    .toTransformString()
            );

        var onClick = function() {
            window.open('http://github.com/JosePedroDias/tenbyten');
        };

        var g = s.group(b, c);
        g.addClass('ribbon');
        g.node.addEventListener('mousedown',  onClick);
        g.node.addEventListener('touchstart', onClick);

    })();



    // begin to capture the initial click to FS
    alert('begin', reset);

})();
