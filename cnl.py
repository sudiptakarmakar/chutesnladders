#!/usr/bin/env python3.4

from flask import Flask, render_template

app = Flask(__name__)


@app.route("/chutesnladders")
@app.route("/cnl")
@app.route("/snakesnladders")
@app.route("/snl")
def chutesnladders():
    response = app.make_response(
        render_template(
            'chutesnladders.min.html'
        )
    )
    return response

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        debug=False
    )
