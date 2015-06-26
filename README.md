# ten by ten

## what is this

I'm programming a clone of the popular mobile game [1010!](http://1010ga.me/)  
The client-side is JS/SVG -> try it [here](http://rawgit.com/JosePedroDias/tenbyten/master/index.html)  
The server-side will be in node.js (ONGOING)


## roadmap

* `DONE   ` mimic game rules and layout
* `ONGOING` refactor logic so it can run in bot client and server-side
* `TODO   ` deploy server to validate ongoing games and store highscores
* `TODO`    make client use server
* `TODO   ` create sfx w/ webaudio


----


## resources

### assets:
* comfortaa font [1](http://www.dafont.com/pt/comfortaa.font)

### client-side libs:
* <http://snapsvg.io/> <http://snapsvg.io/docs/>
* <https://github.com/loov/jsfx> <https://rawgit.com/loov/jsfx/master/index.html>

### server-side modules:
* <http://passportjs.org/>
* <https://github.com/lloyd/node-toobusy> <https://hacks.mozilla.org/2013/01/building-a-node-js-server-that-wont-melt-a-node-js-holiday-season-part-5/>
* <https://github.com/dudleycarr/ratelimit.js>


----


## server-side highscores

    game session state consists of:
    - id    
    - m     (10x10 of bool, initially false)
    - slots (int[3], random pieceIdx)
    - step  (int, initially 0)
    - score (int, initially 0)
    - ended (bool, initially false)


### endpoints:
    
    /new-game
    creates new game session, returning it
    <gameSessionState> (regular scenario)
    
    /play/<sessionId:string>/<step:int>/<slotIndex:int>/<x:int>/<y:int>
    attempts to play the given command and returns updated state
    <gameSessionState> (regular scenario. ended can be true if game over)
    {err:'incorrect arguments'} (if malformed params)
    {err:'piece does not fit'}  (if piece does not fit matrix)
    {err:'inactive session'}    (if session does not exist or ended)
    
    /highscore/<sessionId:string>/<email:string>/<name:string>
    converts an ended state into a high score
    (email is to use gravatar avatar)
    (opcionally does auth via passportjs instead of direct email/name pair)
    {score:<int>, rank:<int>}     (if you didn't make high score table, rank returns -1)
    {err:'incorrect arguments'}   (if malformed params)
    {err:'inactive session'}      (if session does not exist or ended)
    
    /highscores
    returns array of ordered high scores
    {err:null, results:[{name:<string>, email:<string>, score:<int>}]}
