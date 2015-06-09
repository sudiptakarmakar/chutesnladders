#!/usr/bin/env python3.4

from flask import Flask, render_template, request, jsonify, \
    make_response
import time
from sqlitedict import SqliteDict

app = Flask(__name__)

@app.route("/chutesnladders")
@app.route("/cnl")
@app.route("/snakesnladders")
@app.route("/snl")
def chutesnladders():
    response = app.make_response(
        render_template(
            'chutesnladders.html'
        )
    )
    return response

@app.route("/report", methods=['GET', 'POST'])
def reportBug():
    d = {}
    if request.method == 'POST':
        try:
            sender = request.form.get("email", type=str).lower()
            kind = request.form.get("kind", type=str).lower()
            title = kind.upper() +": "+ request.form.get("title", type=str)
            details = request.form.get("details", type=str)
            ts = int(time.time()*(10**6))
            report = request.form.get("reportingEnabled", type=bool)
            if report:
                emailBugReport(sender, kind, title, details, ts)
        except Exception as e:
            print("Error: ", str(e))
        d = {
                "result":
                {
                    "sender": sender,
                    "kind": kind,
                    "title": title,
                    "details": details,
                    "ts": ts
                }
            }
    else:
        d = {"result": "Not post"}

    response = app.make_response( jsonify(**d) )
    return response

def emailBugReport(sender, kind, subject, details, ts):
    bug = {
        "sender": sender,
        "subject": subject,
        "details": details,
        "resolved": False,
        "ts": ts
    }
    with SqliteDict('./db/bugsdb.sqlite') as bugDict:
        if not bugDict.get(kind):
            bugDict[kind] = []
        bugDict[kind] += [bug]
        bugDict.commit()

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        debug=True,
        port=int(9000)
    )