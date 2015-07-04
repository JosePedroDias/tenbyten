# ten by ten

## what is this

I'm programming a clone of the popular mobile game [1010!](http://1010ga.me/)  

* [play w/ server-side validation and global highscores](http://rawgit.com/JosePedroDias/tenbyten/master/index.html)
* [local play (older version)](http://rawgit.com/JosePedroDias/tenbyten/master/local.html)
<!-- * [server stats](http://rawgit.com/JosePedroDias/tenbyten/master/stats.html) -->


## roadmap

* [x] client: mimic game rules and layout
* [x] both:   refactor logic so it can run in bot client and server-side
* [x] client: rewrite client with common refactoring
* [x] server: deploy server to validate ongoing games and store highscores
* [x] client: make client use server
* [x] client: store name, email and theme on localStorage
* [x] client: add some animations (line shrinking pieces, alert fade)
* [x] client: handle server timeout better: lock while communicating; retry n times, allow retry later
* [x] client: create sfx w/ webaudio
* [x] server: added stats endpoint
* [x] client: made stats page
* [ ] client: toggle sound button; use alternate svg icons
* [ ] client: make sfx work on mobile browsers or fallback impl with samples
* [ ] server: store whole game in server for replay
* [ ] client: mode which receives an id for a recorded session and plays it
* [ ] client: make it work on windows phone (lock scroll)
* [ ] client: display credits on 8bit font and ribbon to the github repos 

----


## resources

### assets:
* [Comfortaa font](http://www.dafont.com/pt/comfortaa.font) by [Johan Aakerlund](https://plus.google.com/+JohanAakerlund/about)
* [Pixel Gosub font](http://www.dafont.com/pt/pixel-gosub.font) by [Pixel Sagas](http://www.pixelsagas.com/)
<!--* [Press Start 2P font](http://www.dafont.com/pt/press-start-2p.font) by [codeman38](http://www.zone38.net/font/)-->
* [white balance sunlight icon](http://www.flaticon.com/free-icon/white-balance-sunlight-mode_61401) made by [Freepik](http://www.freepik.com) from [www.flaticon.com](http://www.flaticon.com) is licensed under [CC BY 3.0](http://creativecommons.org/licenses/by/3.0/)
* [camera night mode icon](http://www.flaticon.com/free-icon/camera-night-mode_61412) made by [Freepik](http://www.freepik.com) from [www.flaticon.com](http://www.flaticon.com) is licensed under [CC BY 3.0](http://creativecommons.org/licenses/by/3.0/)
* [ecg lines icon](http://www.flaticon.com/free-icon/ecg-lines_26589) made by [Freepik](http://www.freepik.com) from [www.flaticon.com](http://www.flaticon.com) is licensed under [CC BY 3.0](http://creativecommons.org/licenses/by/3.0/)


### client-side libs:
* [snapSVG](http://snapsvg.io/) - SVG rendering lib
* [jsfx](https://github.com/loov/jsfx) - web audio sound effects

### server-side modules:
* [response-time](https://github.com/expressjs/response-time) - returns response header `X-Response-Time`
* [express-stats](https://github.com/chieffancypants/express-stats) - measures several server stats, returning them at an endpoint (customized it)


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
