(function() {
    'use strict';


    var noop = function() {};


    var sfxLib = {"piece":{"Frequency":{"Start":139,"Min":397.1684554964304,"Slide":-0.8417304918635636,"Max":787},"Generator":{"Func":"sine","A":0.666447072965093,"ASlide":0.09330859859474003},"Phaser":{"Offset":0.1686953672207892,"Sweep":0.1867293302435428},"Volume":{"Sustain":0.05,"Decay":0.07,"Punch":1.06,"Attack":0.01,"Master":0.64}},"denied":{"Frequency":{"Start":439,"Slide":-0.83,"Max":1800,"Min":30,"ChangeSpeed":0,"DeltaSlide":0.2},"Generator":{"Func":"string","A":0.26,"B":0,"ASlide":0},"Filter":{"HP":0.15,"LP":1,"LPSlide":0.01,"LPResonance":0,"HPSlide":-0.41},"Volume":{"Sustain":0.2,"Decay":0.24,"Punch":0.24,"Master":0.52},"Vibrato":{"Depth":0},"Phaser":{"Offset":0.01}},"more":{"Frequency":{"Start":660,"Slide":0.51,"Max":1800,"DeltaSlide":-0.26},"Generator":{"Func":"synth","BSlide":0.17,"ASlide":-0.43},"Phaser":{"Offset":0.5935326264007017,"Sweep":-0.12729871559422462},"Volume":{"Sustain":0.19,"Decay":0.33,"Punch":0.43},"Vibrato":{"Depth":0.06,"Frequency":35.01,"DepthSlide":-0.31,"FrequencySlide":-0.2},"Filter":{"LPSlide":-0.1,"LPResonance":0.19,"HP":0.82}},"line":{"Frequency":{"Start":73,"Min":1362,"Max":1769.8050347110257,"Slide":0.31,"DeltaSlide":-0.31,"RepeatSpeed":0.32,"ChangeAmount":-5,"ChangeSpeed":0.43},"Vibrato":{"Depth":0.24,"DepthSlide":-0.68,"Frequency":14.01,"FrequencySlide":0.26},"Generator":{"Func":"string","A":0.6544020092114806,"B":0.6996062810067087,"ASlide":0.9439933458343148,"BSlide":-0.8408931125886738},"Guitar":{"A":0.4469512205105275,"B":0.4436649903655052,"C":0.3948096898384392},"Phaser":{"Offset":0.9750056094489992,"Sweep":0.02325455006211996},"Volume":{"Master":0.64,"Attack":0.08,"Sustain":0.25,"Punch":0.58,"Decay":0.85},"Filter":{"HP":0,"LPResonance":0}},"start":{"Frequency":{"Start":630.3844311484136,"Min":1380.6388479773887,"Max":193.86719992384315,"Slide":-0.3229934247210622,"DeltaSlide":-0.6038368884474039,"RepeatSpeed":1.1204902755562216,"ChangeAmount":-10.367714105173945,"ChangeSpeed":0.2946239020675421},"Vibrato":{"Depth":0.9577971468679607,"DepthSlide":-0.7794344457797706,"Frequency":25.28196069442202,"FrequencySlide":0.1149409250356257},"Generator":{"Func":"sine","A":0.8635227780323476,"B":0.15138676925562322,"ASlide":0.3261460131034255,"BSlide":-0.5880415849387646},"Guitar":{"A":0.9728574715554714,"B":0.6253615105524659,"C":0.34530656365677714},"Phaser":{"Offset":0.4403600045479834,"Sweep":0.38121403893455863},"Volume":{"Master":0.4,"Attack":0.2446278550196439,"Sustain":1.1377039570361376,"Punch":1.1716240528039634,"Decay":0.9491019332781434}}};


    var sampleNames = 'start piece line denied more'.split(' ');


    var audioSamplesPlayer = function(names, samplesDir) {
        var api = {};
        var audioEls = {};

        var samplePlay = function(name) {
            var audioEl = audioEls[name];
            return function() {
                //console.log('playing %s...', name);
                audioEl.pause();
                audioEl.currentTime = 0;
                audioEl.play();
            }
        };

        names.forEach(function(name) {
            var audioEl = document.createElement('audio');

            var sourceEl = document.createElement('source');
            sourceEl.setAttribute('type', 'audio/mp3');
            sourceEl.setAttribute('src', samplesDir + name + '.mp3');
            audioEl.appendChild(sourceEl);

            sourceEl = document.createElement('source');
            sourceEl.setAttribute('type', 'audio/ogg');
            sourceEl.setAttribute('src', samplesDir + name + '.ogg');
            audioEl.appendChild(sourceEl);

            audioEls[name] = audioEl;

            api[name] = samplePlay(name);
        });

        return api;
    };


    window.setupSfx = function(mode) {
        var sfx;
        if (mode === 2) { // WEBAUDIO
            sfx = jsfx.Sounds(sfxLib);
        }
        else if (mode === 1) { // AUDIOELEMENT
            sfx = audioSamplesPlayer(sampleNames, 'assets/');
        }
        else { // NONE
            sfx = {};
            names.forEach(function(name) {
                sfx[name] = noop;
            });
        }
        return sfx;
    };

})();
