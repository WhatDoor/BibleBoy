import json
import re

ESV = {}
NIV = {}

with open('ESVbible.json') as json_file:
    ESV = json.load(json_file)

with open('bible.json') as json_file:
    NIV = json.load(json_file)

for book in NIV:
    if book != "ecclesiastes" and book != "song of songs":
        for chapter in NIV[book]:
            for verse in NIV[book][chapter]:
                test = ""
                test = ESV[book][chapter][verse]

                if test != "":
                    print("MATCHED: " + book + " - " + chapter + " - " + verse)
                else:
                    break