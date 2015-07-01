from locust import HttpLocust, TaskSet
import json
from random import randint as rnd


"""
http://docs.locust.io/en/latest/writing-a-locustfile.html#making-http-requests
https://docs.python.org/2/tutorial/datastructures.html#dictionaries
"""


def highscores(l):
    """
    /highscores
    """
    resp = l.client.get("/highscores")
    o = json.loads(resp.content)
    #print "highscores: %d" % (len(o))
    
    
def new_game(l):
    """
    /new-game
    """
    #print "starting new game"
    resp = l.client.get("/new-game")
    o = json.loads(resp.content)
    l.st = o


def play(l):
    """
    /play/<sessionId:string>/<step:int>/<slotIndex:int>/<x:int>/<y:int>
    """
    if not hasattr(l, 'st'):
        return new_game(l)
    
    st = l.st
    resp = l.client.get("/play/%s/%d/%d/%d/%d" % (st['id'], st['step'], rnd(0, 2), rnd(0, 6), rnd(0, 6)))
    o = json.loads(resp.content)
    
    if 'err' in o:
        #print "made a wrong move. aborting game session"
        del l.st
    #else:
    #    print "made a possible move"

#----

def get(l):
    """
    /get/<sessionId:string>
    """
    st = l.st
    resp = l.client.get("/get/%s" % (st['id']))


def active_sessions(l):
    """
    /active-sessions
    """
    resp = l.client.get("/active-sessions")
    o = json.loads(resp.content)
    #print "active sessions: %d" % (len(o))



class UserBehavior(TaskSet):
    tasks = {
        highscores: 1,
        play: 1
        #get: 1
        #active_sessions: 1
    }

    def on_start(self):
        new_game(self)



class WebsiteUser(HttpLocust):
    task_set = UserBehavior
    min_wait = 5000
    max_wait = 9000
