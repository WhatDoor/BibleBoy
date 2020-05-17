import json
import re

with open('rawESV.txt', 'r') as f:
    data = f.read()

bible = {}

bibleList = data.split("\n")
currentBook = ""
currentChapter = 0
currentVerse = 0

for line in bibleList:
    if re.search("^[0-9]+. ([0-4] \w+|Song of Songs|\w+)$", line): #BOOK
        currentBook = re.search("^[0-9]+. ([0-4] \w+|Song of Songs|\w+)$", line).group()[3:].lower().strip()
        bible[currentBook] = {}

        print("Current Book: " + currentBook)

    elif re.search("^[0-9]+.[0-9]+. Chapter [0-9]+$", line): #Chapter
        currentChapter = re.search("Chapter [0-9]+", line).group()[8:]
        bible[currentBook][currentChapter] = {}
        currentVerse = 0

        #print("Current Chapter: " + currentChapter)

    elif re.search("^([0-9]+\(.+\)|[0-9]+)$", line): #Verse
        verse = int(re.search("^[0-9]+", line).group())

        if verse == currentVerse + 1:
            currentVerse = verse
            bible[currentBook][currentChapter][currentVerse] = ""

            #print(currentVerse)

    elif re.search("^\(.+\)$", line):  #Heading (Ignore)
        heading = re.search("^\(.+\)$", line).group()
        #print("Skipping " + heading)

    else: #Append verse
        currentStateOfVerse = bible[currentBook][currentChapter][currentVerse]

        if currentStateOfVerse == "":
            currentStateOfVerse = line
        else:
            currentStateOfVerse = currentStateOfVerse + " " + line

        bible[currentBook][currentChapter][currentVerse] = currentStateOfVerse

        #print("Appending: " + line)

#Save Changes
with open("ESVbible.json", "w") as outfile:
    json.dump(bible, outfile, indent=4)