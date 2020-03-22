import json
import re

with open('NIV', 'r') as f:
    data = f.read()

bible = {}

bibleList = data.split("\n")
currentBook = ""

for line in bibleList:
    if (re.search("<b n=\"(1 |2 |3 |)\w+\">", line)): #BOOK
        currentBook = re.search("\"(1 |2 |3 |)\w+\"", line).group()[1:-1].lower()
        bible[currentBook] = {}
    elif (re.search("<c n=\"[0-9]+\">", line)): #Chapter
        currentChapter = re.search("\"[0-9]+\"", line).group()[1:-1]
        bible[currentBook][currentChapter] = {}
    elif (re.search("<v n=\"[0-9]+\">.+<\/v>", line)): #Verse
        currentVerse = re.search("\"[0-9]+\">", line).group()[1:-2]
        verseText = re.search(">.+<", line).group()[1:-1]
        bible[currentBook][currentChapter][currentVerse] = verseText

#Save Changes
with open("bible.json", "w") as outfile:
    json.dump(bible, outfile, indent=4)