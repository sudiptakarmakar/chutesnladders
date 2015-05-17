#!/usr/bin/env python3.4
import time
from sqlitedict import SqliteDict

with SqliteDict('./db/bugsdb.sqlite') as bugDict:
    for i in bugDict:
        print(bugDict[i], "\n\n")
        #print("O: ", i," \n<|> ", bugDict[i])
        #for x in bugDict[i]:
            #print("IN: ", x," \n<|> ", len(x)," \n<|> ", type(x))