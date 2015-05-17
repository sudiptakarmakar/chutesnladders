#!/usr/bin/env python3.4

from flask import Flask, flash, render_template, request, jsonify, \
    make_response, session, url_for, redirect
import os
import json


import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

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
        print("POST Req rcvd")
        try:
            sender = request.form.get("email", type=str)
            subject = "CNL BUG: " + request.form.get("title", type=str)
            details = request.form.get("details", type=str)
            emailBugReport(sender, subject, details)
        except Exception as e:
            print("problem reading data"+str(e))
        d = {"result": "POST done"}

    elif request.method == 'GET':
        print("GET Req rcvd")
        d = {"result": "GET done"}

    response = app.make_response( jsonify(**d) )
    return response

def emailBugReport(sender, subject, details):

    # sender == reporter's email address
    # recipient == recipient's email address
    if not sender:
        sender = "reporting@cnl.com"
    recipient = "sudipta.genius@gmail.com"

    # Create message container - the correct MIME type is multipart/alternative.
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = sender
    msg['To'] = recipient

    # Create the body of the message (a plain-text and an HTML version).
    #text = "Hi!\nHow are you?\nHere is the link you wanted:\nhttps://www.python.org"
    text = details
    html = """\
    <html>
      <head></head>
      <body>
        <p>Hi!<br>
           How are you?<br>
           Here is the <a href="https://www.python.org">link</a> you wanted.
        </p>
      </body>
    </html>
    """

    # Record the MIME types of both parts - text/plain and text/html.
    part1 = MIMEText(text, 'plain')
    part2 = MIMEText(html, 'html')

    # Attach parts into message container.
    # According to RFC 2046, the last part of a multipart message, in this case
    # the HTML message, is best and preferred.
    msg.attach(part1)
    msg.attach(part2)

    # Send the message via local SMTP server.
    print("checkpoint:", "<start>")
    #s = smtplib.SMTP(host='localhost', port=9000)
    with smtplib.SMTP("localhost") as s:
        print("checkpoint:", s, "<end>")
        # sendmail function takes 3 arguments: sender's address, recipient's address
        # and message to send - here it is sent as one string.
        print("Sending mail", msg.as_string())
        s.sendmail(sender, recipient, msg.as_string())
        print("Mail sent!")
    print("exit sendmail")

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        debug=True,
        port=int(9000)
    )