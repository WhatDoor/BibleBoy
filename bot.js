var Discord = require('discord.js');
var logger = require('winston');
var auth = require('./auth.json');
var fs = require('fs');
var titleCase = require('title-case')

//Load in the bible
const fileContents = fs.readFileSync('bible.json', 'utf8');
const bible = JSON.parse(fileContents)

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
const client = new Discord.Client();

client.once('ready', () => {
    console.log("ready!");    
});

client.login(auth.token)

client.on('message', async message => {
    //Only triggers code if message falls into one of the possible categories
    messageText = message.content

    //Define Regexes
    //Specific Verse
    const specificVerseRegex = RegExp("^(1 |2 |3 |)\\w+ [0-9]+:[0-9]+$",'gi')

    //Whole Chapter
    const wholeChapRegex = RegExp("^(1 |2 |3 |)\\w+ [0-9]+$",'gi')

    //Range within chapter
    const rangeWithinRegex = RegExp("^(1 |2 |3 |)\\w+ [0-9]+:[0-9]+-[0-9]+$",'gi')

    //Range accross chapters
    const rangeAcrossRegex = RegExp("^(1 |2 |3 |)\\w+ [0-9]+:[0-9]+-[0-9]+:[0-9]+$",'gi')

    if (specificVerseRegex.test(messageText)) {
        returnMessage = ""

        bookAndRef = getBookandReference(messageText)

        book = bookAndRef[0]
        reference = bookAndRef[1]

        chapter = reference.split(":")[0]
        verse = reference.split(":")[1]

        try {
            returnMessage = bible[book][chapter][verse]
        } catch (error) {
            returnMessage = ""
        }

        if (returnMessage == "" || returnMessage === undefined) {
            returnMessage = "Reference not found :("
        }

        deliverMessage(titleCase.titleCase(book) + " " + reference, returnMessage, message.channel)

    } else if (wholeChapRegex.test(messageText)) {
        returnMessage = ""

        bookAndRef = getBookandReference(messageText)

        book = bookAndRef[0]
        chapter = bookAndRef[1]

        //Retrieve all verses within the chapter and append it returnMessage
        try {
            count = 1
            for (const verseNum in bible[book][chapter]) {
                if (count == 1) {
                    returnMessage = returnMessage + verseNum + " " + bible[book][chapter][verseNum]
                } else {
                    returnMessage = returnMessage + " " + verseNum + " " + bible[book][chapter][verseNum]
                }
                count++;
            }
        } catch (error) {
            returnMessage = ""
        }

        returnMessage = messageCheck(returnMessage)

        //Check if message is too long and handle message delivery
        deliverMessage(titleCase.titleCase(book) + " " + chapter, returnMessage, message.channel)

    } else if (rangeWithinRegex.test(messageText)) {
        returnMessage = ""

        bookAndRef = getBookandReference(messageText)

        book = bookAndRef[0]
        reference = bookAndRef[1]

        chapter = reference.split(":")[0]
        startVerse = parseInt(reference.split(":")[1].split("-")[0])
        endVerse = parseInt(reference.split(":")[1].split("-")[1])
        currentVerse = startVerse

        //Retrieve all verses within the range and append it to returnMessage
        try {
            count = 1
            while (currentVerse <= endVerse) {
                if (count == 1) {
                    returnMessage = returnMessage + currentVerse + " " + bible[book][chapter][currentVerse]
                } else {
                    returnMessage = returnMessage + " " + currentVerse + " " + bible[book][chapter][currentVerse]
                }
                currentVerse++;
                count++;
            }
        } catch (error) {
            returnMessage = ""
            console.log("error in retrieving range within chapter")
        }

        returnMessage = messageCheck(returnMessage)

        //Check if message is too long and handle message delivery
        deliverMessage(titleCase.titleCase(book) + " " + reference, returnMessage, message.channel)

    } else if (rangeAcrossRegex.test(messageText)) {
        returnMessage = ""

        bookAndRef = getBookandReference(messageText)

        book = bookAndRef[0]
        reference = bookAndRef[1]

        startRef = reference.split("-")[0]
        endRef = reference.split("-")[1]

        startChap = parseInt(startRef.split(":")[0])
        startVerse = parseInt(startRef.split(":")[1])

        endChap = parseInt(endRef.split(":")[0])
        endVerse = parseInt(endRef.split(":")[1])

        //get all verses of the first chapter


        //get all verses of the middle chapters


        //get all verses of the final chapter

        //e.g. genesis 3:1-4:12 - would need to somehow find out what is the last verse of the current chapter... and future chapters...
        //IDEA: Iterate through the current chapter, and find the highest number in it
        returnMessage = "Sorry, I can't do that yet :(" //temp message

        deliverMessage(titleCase.titleCase(book) + " " + reference, returnMessage, message.channel)
    }
})

function getLastVerseOfChapter(chapter) {
    lastVerse = 1

    for (verse in chapter) {
        if (verse > lastVerse)
            lastVerse = verse
    }

    return lastVerse
}

//If message is over 1900 characters long, then use this function to split it. Returns an array of messages shorter than 1900 characters
function messageSplit(returnMessage) {
    startIndex = 0
    endIndex = 1900

    charactersSent = 0;

    returnArray = []

    //Splits text into chunks of 1900 characters
    while (returnMessage.length - charactersSent > 1900) {
        slicedMessageLength = 1900

        //Adjusting endIndex to complete word
        while (returnMessage.charAt(endIndex-1) != " ") {
            endIndex++
            slicedMessageLength++
        }

        slicedMessage = returnMessage.slice(startIndex,endIndex) + "-";
        
        startIndex = startIndex + slicedMessageLength
        endIndex = endIndex + 1900
        charactersSent = charactersSent + slicedMessageLength

        returnArray.push(slicedMessage)
    }

    //Push whatever is left of the message
    returnArray.push(returnMessage.slice(startIndex));

    return returnArray
}

//Checks if there is actually a message, and returns error message if not
function messageCheck(messageText) {
    if (returnMessage == "" || returnMessage === undefined) {
        return "Reference not found :("
    } else {
        return messageText
    }
}

//Separates the book and reference (or chapter), and returns them in an array [0] is book and [1] is reference
function getBookandReference(messageText) {
    if (messageText[0] >= '0' && messageText[0] <= '9') { //For books with numbers before them
        book = messageText.split(" ")[0] + " " + messageText.split(" ")[1].toLowerCase()
        reference = messageText.split(" ")[2]
    } else { //All other cases
        book = messageText.split(" ")[0].toLowerCase()
        reference = messageText.split(" ")[1]
    }

    book = book.toLowerCase()
    book = checkAbbriev(book)

    return [book,reference]
}

//Handles message delivery - checks length of message and splits messages as appropriate
function deliverMessage(title, returnMessage, channel) {
    if (returnMessage.length > 1900) {
        messageArray = messageSplit(returnMessage)
        counter = 1

        for (msg of messageArray) {
            if (counter == 1)
                packageAndSend(title, msg, channel)
            else
                packageAndSend("", msg, channel)

            counter++
        }

    } else {
        packageAndSend(title, returnMessage, channel)
    }
}

//Packages messages in embed and sends them
function packageAndSend(title, message, channel) {
    const embedMessage = new Discord.MessageEmbed()
        .setColor('#9932CC')
        .setTitle(title)
        .setDescription(message)
        .setTimestamp()
        .setFooter('Made for Tehillah')
    
    channel.send(embedMessage);
}

function checkAbbriev(bookname) {
    switch (bookname) {
        case "gen":
            return "genesis"
            break;
        case "ex":
            return "exodus"
            break;
        case "lev":
            return "leviticus"
            break;
        case "num":
            return "numbers"
            break;
        case "deut":
            return "deuteronomy"
            break;
        case "josh":
            return "joshua"
            break;
        case "judg":
            return "judges"
            break;
        case "1 sam":
            return "1 samuel"
            break;
        case "2 sam":
            return "2 samuel"
            break;
        case "1 chr":
            return "1 chronicles"
            break;
        case "2 chr":
            return "2 chronicles"
            break;
        case "neh":
            return "nehemiah"
            break;
        case "est":
            return "esther"
            break;
        case "ps":
            return "psalms"
            break;
        case "prov":
            return "proverbs"
            break;
        case "eccles":
            return "ecclesiastes"
            break;
        case "song":
            return "song of solomon"
            break;
        case "isa":
            return "isaiah"
            break;
        case "jer":
            return "jeremiah"
            break;
        case "lam":
            return "lamentations"
            break;
        case "ezek":
            return "ezekiel"
            break;
        case "dan":
            return "daniel"
            break;
        case "hos":
            return "hosea"
            break;
        case "obad":
            return "obadiah"
            break;
        case "mic":
            return "micah"
            break;
        case "nah":
            return "nahum"
            break;
        case "hab":
            return "habakkuk"
            break;
        case "zeph":
            return "zephaniah"
            break;
        case "hag":
            return "haggai"
            break;
        case "zech":
            return "zechariah"
            break;
        case "mal":
            return "malachi"
            break;
        case "matt":
            return "matthew"
            break;
        case "rom":
            return "romans"
            break;
        case "1 cor":
            return "1 corinthians"
            break;
        case "2 cor":
            return "2 corinthians"
            break;
        case "gal":
            return "galatians"
            break;
        case "eph":
            return "ephesians"
            break;
        case "phil":
            return "philippians"
            break;
        case "col":
            return "colossians"
            break;
        case "1 thess":
            return "1 thessalonians"
            break;
        case "2 thess":
            return "2 thessalonians"
            break;
        case "1 tim":
            return "1 timothy"
            break;
        case "2 tim":
            return "2 timothy"
            break;
        case "philem":
            return "philemon"
            break;
        case "heb":
            return "hebrews"
            break;
        case "1 pet":
            return "1 peter"
            break;
        case "2 pet":
            return "2 peter"
            break;
        case "rev":
            return "revelation"
            break;
        default:
            return bookname
    }
}
