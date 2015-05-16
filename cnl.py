#!/usr/bin/env python3.4

from flask import Flask, flash, render_template, request, jsonify, \
    make_response, session, url_for, redirect
import os
import json

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

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        debug=True,
        port=int(9000)
    )