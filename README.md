# ten by ten

## what is this

I'm programming a clone of the popular mobile game [1010!](http://1010ga.me/)  

* [local play](http://rawgit.com/JosePedroDias/tenbyten/master/local.html)
* [cli w/ server-side validation](http://rawgit.com/JosePedroDias/tenbyten/master/index.html)


## roadmap

* `DONE   ` client: mimic game rules and layout
* `DONE   ` both:   refactor logic so it can run in bot client and server-side
* `DONE   ` client: rewrite client with common refactoring
* `DONE   ` server: deploy server to validate ongoing games and store highscores
* `DONE   ` client: make client use server
* `DONE   ` client: store name, email and theme on localStorage
* `DONE   ` client: add some animations (line shrinking pieces, alert fade)
* `TODO   ` client: handle server timeout better: lock while communicating; retry n times, allow retry later
* `TODO   ` server: try to limit server load (w/ toobusy)
* `TODO   ` client: make it work on windows phone (lock scroll)
* `TODO   ` client: create sfx w/ webaudio?


----


## resources

### assets:
* comfortaa font [1](http://www.dafont.com/pt/comfortaa.font)

### client-side libs:
* <http://snapsvg.io/> <http://snapsvg.io/docs/>
* NOT IN USE YET <https://github.com/loov/jsfx> <https://rawgit.com/loov/jsfx/master/index.html>

### server-side modules:
* NOT IN USE YET <http://passportjs.org/>
* NOT IN USE YET <https://github.com/lloyd/node-toobusy> <https://hacks.mozilla.org/2013/01/building-a-node-js-server-that-wont-melt-a-node-js-holiday-season-part-5/>
* NOT IN USE YET <https://github.com/dudleycarr/ratelimit.js>


----


## server-side highscores

    game session state consists of:
    - id    (session id)
    - m     (10x10 of bool, initially false)
    - slots (int[3], random pieceIdx, each can be false if empty)
    - step  (int, initially 0)
    - score (int, initially 0)
    - ended (bool, initially false)


### endpoints:
    
    /new-game
    creates new game session, returning it
    <gameSessionState> (always)
    
    
    /play/<sessionId:string>/<step:int>/<slotIndex:int>/<x:int>/<y:int>
    attempts to play the given command and returns updated state
    {err:'invalid arguments'} (if malformed params)    
    {err:'inactive session'}  (if session does not exist)
    {err:'finished game'}     (if session already ended)
    {err:'no piece found'}    (if slot has no piece)
    {err:'piece did not fit'} (if piece does not fit matrix)
    
    
    /highscore/<sessionId:string>/<email:string>/<name:string>
    converts an ended state into a high score (email is to use gravatar avatar)
    {score:<int>, rank:<int>} (regular scenario)
    {err:'inactive session'}  (if session does not exist)
    {err:'unfinished game'}   (if session hasn't ended)
    
    
    /highscores
    returns array of ordered high scores
    {err:null, results:[{name:<string>, email:<string>, score:<int>}]}
    
    
    /get/<sessionId:string>
    for debugging purposes. sends current state, with matrix
    
    
    /active-sessions
    for debugging purposes. returns array of active sessions
