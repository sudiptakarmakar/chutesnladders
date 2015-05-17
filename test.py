#!/usr/bin/env python3.4

import smtplib
#from smtplib import SMTPException

sender = 'sudipta.genius@gmail.com'
receivers = ['sudo.karmakar@gmail.com']

message = """From: From Person <from@fromdomain.com>
To: To Person <to@todomain.com>
Subject: SMTP e-mail test

This is a test e-mail message.
"""

try:
   smtpObj = smtplib.SMTP('localhost')
   smtpObj.sendmail(sender, receivers, message)         
   print("Successfully sent email")
except smtplib.SMTPException:
   print("Error: unable to send email")
