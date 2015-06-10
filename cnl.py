#!/usr/bin/env python3.4

from flask import Flask, render_template, request, jsonify
from time import time

application = Flask(__name__)


@application.route("/chutesnladders")
@application.route("/cnl")
@application.route("/snakesnladders")
@application.route("/snl")
def chutesnladders():
    response = application.make_response(
        render_template(
            'chutesnladders.min.html'
        )
    )
    return response


@application.route("/report", methods=['GET', 'POST'])
def reportBug():
    d = {}
    if request.method == 'POST':
        try:
            email = request.form.get("email", type=str).lower()
            kind = request.form.get("kind", type=str).lower()
            title = kind.upper() + ": " + request.form.get("title", type=str)
            details = request.form.get("details", type=str)
            ts = int(time()*(10**6))
            report = request.form.get("reportingEnabled", type=bool)
            if report:
                sendmail.sendMeResponse({
                                        'ts': ts,
                                        'feed_email': email,
                                        'feed_name': email.split('@')[0],
                                        'feed_message': details,
                                        'feed_subject': title,
                                        })
            d = {"result": "Received"}
        except Exception:
            d = {"result": "Error in receiving"}
    else:
        d = {"result": "Bad request"}
    response = application.make_response(jsonify(**d))
    return response
# EVERY FUNCTION FOR CHUTES n LADDERS END HERE

if __name__ == "__main__":
    application.run(
        host='0.0.0.0',
        debug=False
    )
