#Code based on https://github.com/drshrey/spotify-flask-auth-example

import json
import sqlite3
import urllib
import os

from urllib.parse import urlparse, quote

from flask import flash,Flask,request,render_template,session,url_for,redirect

import requests

app = Flask(__name__, static_url_path='/static')
app.secret_key="Something"

if not os.path.isfile("client.txt"):
    print('Cannot get client details.')
    exit()
else:
    with open("client.txt") as f:
        content = f.read().splitlines()
        if len(content)>1:
            CLIENT_ID=content[0]
            CLIENT_SECRET=content[1]
        else:
            exit()

SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_API_BASE_URL = "https://api.spotify.com"
API_VERSION = "v1"
SPOTIFY_API_URL = "{}/{}".format(SPOTIFY_API_BASE_URL, API_VERSION)



# Server-side Parameters
CLIENT_SIDE_URL = "http://127.0.0.1"
CLIENT_SIDE_URL = "http://localhost"
PORT = 5000
REDIRECT_URI = "{}:{}/callback".format(CLIENT_SIDE_URL, PORT)
SCOPE = "playlist-modify-public user-read-private playlist-modify-private playlist-read-private"
STATE = ""
SHOW_DIALOG_bool = True
SHOW_DIALOG_str = str(SHOW_DIALOG_bool).lower()




auth_query_parameters = {
    "response_type": "code",
    "redirect_uri": REDIRECT_URI,
    "scope": SCOPE,
    "client_id": CLIENT_ID
}

@app.route("/")
def home():
    return render_template('index.html', url=CLIENT_SIDE_URL + url_for("authorize"))

@app.route("/auth")
def authorize():
    url_args = "&".join(["{}={}".format(key, quote(val)) for key, val in auth_query_parameters.items()])
    auth_url = "{}/?{}".format(SPOTIFY_AUTH_URL, url_args)
    return redirect(auth_url)

@app.route("/callback")
def callback():
    if "code" in request.args:
        auth_token=request.args['code']
        code_payload = {
            "grant_type": "authorization_code",
            "code": str(auth_token),
            "redirect_uri": REDIRECT_URI,
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
        }
        post_request = requests.post(SPOTIFY_TOKEN_URL, data=code_payload)

        # Auth Step 5: Tokens are Returned to Application
        response_data = json.loads(post_request.text)
        access_token = response_data["access_token"]
        session["refresh_token"] = response_data["refresh_token"]
        token_type = response_data["token_type"]
        expires_in = response_data["expires_in"]

        # Auth Step 6: Use the access token to access Spotify API
        session["authorization_header"] = {"Authorization": "Bearer {}".format(access_token)}
        print(access_token)

        search = "{}/me".format(SPOTIFY_API_URL)
        profile_response = requests.get(search, headers=session["authorization_header"])
        profile_data = json.loads(profile_response.text)
        session["user"]=profile_data
        print(profile_data["display_name"])
        return redirect(url_for("playlists"))
    return redirect(url_for("home"))

@app.route("/playlists")
def playlists():
    if "user" in session.keys():
        if not updateSession():
            return redirect(url_for("home"))
        offset=0
        outOfPlaylists=False
        mine=[]
        collab=[]
        if "nofif" in request.args.keys():
            notif=request.args.get("notif")
        else:
            notif=False
        search = "{}/me/playlists?limit=50&offset={}".format(SPOTIFY_API_URL,offset)
        while not outOfPlaylists:
            profile_response = requests.get(search, headers=session["authorization_header"])
            profile_data = json.loads(profile_response.text)
            if not profile_data["next"]:
                outOfPlaylists=True
            else:
                search=profile_data["next"]

            for playlist in profile_data["items"]:
                if playlist["owner"]["id"]==session["user"]["id"]:
                    mine.append(playlist)
                elif playlist["collaborative"]:
                    print(playlist["name"])
                    collab.append(playlist)


        return render_template('playlists.html', display_name=session["user"]["display_name"], mine=mine, collab=collab, notif=notif)
    else:
        return redirect(url_for("home"))

def updateSession():
    search = "{}/me".format(SPOTIFY_API_URL)
    profile_response = requests.get(search, headers=session["authorization_header"])
    profile_data = json.loads(profile_response.text)
    if "error" in  profile_data.keys():
        refresh = "{}?grant_type=refresh_token&refresh_token={}".format(SPOTIFY_TOKEN_URL,session["refresh_token"])
        profile_response = requests.get(refresh, headers=session["authorization_header"])
        print(profile_response)
        if profile_response:
            token = json.loads(profile_response.text)["access_token"]
            session["authorization_header"] = {"Authorization": "Bearer {}".format(token)}
            return True
        else:
            print("AHHHHHHHJHHHHHHH")
            return False
    else:
        return True

@app.route("/edit")
def populate():
    #type should be albums or playlists
    type=request.args.get("type")
    id=request.args.get("id")
    updateSession()
    print(type,id)
    if type and id:
        if type=="albums" or type=="playlists":
            search = "{}/{}/{}".format(SPOTIFY_API_URL,type,id)

            search_response = requests.get(search, headers=session["authorization_header"])
            search_data = json.loads(search_response.text)

            if "error" not in search_data.keys():
                if type == "albums" or (search_data["collaborative"] == False and search_data["owner"]["id"] != session["user"]["id"]) :
                    editable=False
                else:
                    editable=True

                passData={
                    "name":search_data["name"],
                    "id":search_data["id"],
                    "public":search_data["public"],
                    "description":search_data["description"],
                    "pic":search_data["images"][0]["url"] if len(search_data["images"]) else [],
                    "tracks":[],
                    "type":type,
                    "auth":session["authorization_header"]["Authorization"]
                }


                while search:
                    if "next" in search_data.keys() and search_data["next"]:
                        search_response = requests.get(search, headers=session["authorization_header"])
                        search_data = json.loads(search_response.text)
                    else:
                        search=None

                    for track in search_data["tracks"]["items"]:
                        print(track["track"]["artists"])
                        passData["tracks"].append({"name":track["track"]["name"],"uri":track["track"]["uri"], "artists":" & ".join([artist["name"] for artist in track["track"]["artists"]])})
                return render_template('single.html', display_name=session["user"]["display_name"], editable=editable, passData=passData)
    return redirect(url_for("playlists", notif="Playlist not found "))

@app.route("/add")
def new():
    if "type" in request.args.keys():
        if request.args["type"]=="scratch":
            pass
        elif request.args["type"]=="duplicate":
            type=request.args.get("playlist") #True is playlist, false is album
            id=request.args.get("id")
            updateSession()
            #print(type,id)
            if type and id:
                if type:
                    search = "{}/playlists/{}".format(SPOTIFY_API_URL,id)
                else:
                    search = "{}/albums/{}".format(SPOTIFY_API_URL,id)
                search_response = requests.get(search, headers=session["authorization_header"])
                search_data = json.loads(search_response.text)

                new_playlist="{}/users/{}/playlists".format(SPOTIFY_API_URL,session["user"]["id"])
                new_response = requests.post(new_playlist, headers=session["authorization_header"], json={"name":search_data["name"]+" copy"})
                new_data = json.loads(new_response.text)
                #print(new_data)

                tracks=[]

                #print(search_data["tracks"]["items"][0]["track"].keys())

                while search:
                    add_songs="{}/playlists/{}/tracks".format(SPOTIFY_API_URL,new_data["id"])
                    tracks=[uri["track"]["uri"] for uri in search_data["tracks"]["items"]]
                    add_response = requests.post(add_songs, headers=session["authorization_header"], json={"uris":tracks})
                    add_data = json.loads(add_response.text)

                    #print(add_data)
                    if "next" in search_data.keys() and search_data["next"]:
                        search_response = requests.get(search, headers=session["authorization_header"])
                        search_data = json.loads(search_response.text)
                        search=search_data["next"]
                    else:
                        search=None

    return(redirect(url_for("playlists")))


def params_to_list(arg):
    ret = []
    for val in arg.split(','):
        if val:
            ret.append(val)
    return ret

if __name__ == "__main__":
    app.debug = True
    app.run()
