# ten by ten

## what is this

I'm programming a clone of the popular mobile game [1010!](http://1010ga.me/)  
The client-side is JS/SVG  
The server-side will be in node.js

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

estado tem q ser todo validado pelo servidor


    estado mantido por sessão:
    - matrix    (10x10 de booleano, inicialmente false)
    - slots     (int[3], random de tipos de peças)
    - stepNr    (0)
    - score     (0)
    - gameEnded (false)


### endpoints:
    
    /new-game
    {err:null, sessionId:<string>, slots:<int[3]>}
    
    /play/<sessionId:string>/<stepNr:int>/<slotIndex:int>/<x:int>/<y:int>
    {err:null, gameEnded:false, score:<int>, newPiece:<int>} (cenário normal)
    {err:null, gameEnded:true, score:<int>}                  (se n há mais posições)
    {err:'incorrect arguments'}                              (se erro nos parâmetros)
    {err:'piece does not fit'}                               (se peça não cabe no tabuleiro)
    {err:'inactive session'}                                 (se nunca existiu ou já restagada para high scores)
    
    /highscore/<session-id:string>/<email:string>/<name:string>  (mail é para o gravatar)
    (opcionalmente autentica com passportjs em vez de mail/user)
    grava score e inutiliza sessão
    {err:null, score:<int>}
    {err:'incorrect arguments'}                              (se erro nos parâmetros)
    {err:'inactive session'}                                 (se nunca existiu ou já restagada para high scores)
    
    /highscores
    {err:null, results:[{name:<string>, email:<string>, score:<int>}]}
