var Discord = require('discord.io');
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
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});
bot.on('message', async function (user, userID, channelID, message, evt) {
    //Only triggers code if message falls into one of the possible categories

    //Define Regexes
    //Specific Verse
    const specificVerseRegex = RegExp("^(1 |2 |3 |)\\w+ [0-9]+:[0-9]+$",'gi')

    //Whole Chapter
    const wholeChapRegex = RegExp("^(1 |2 |3 |)\\w+ [0-9]+$",'gi')

    //Range within chapter
    const rangeWithinRegex = RegExp("^(1 |2 |3 |)\\w+ [0-9]+:[0-9]+-[0-9]+$",'gi')

    //Range accross chapters
    const rangeAcrossRegex = RegExp("^(1 |2 |3 |)\\w+ [0-9]+:[0-9]+-[0-9]+:[0-9]+$",'gi')

    if (specificVerseRegex.test(message)) {
        returnMessage = ""

        if (message[0] >= '0' && message[0] <= '9') { //For books with numbers before them
            book = message.split(" ")[0] + " " + message.split(" ")[1].toLowerCase()
            reference = message.split(" ")[2]
        } else { //All other cases
            book = message.split(" ")[0].toLowerCase()
            reference = message.split(" ")[1]
        }

        book = book.toLowerCase()
        book = checkAbbriev(book)
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

        bot.sendMessage({
            to: channelID,
            message: ("```**" + titleCase.titleCase(book) + " " + reference + "**\n" + returnMessage + "```") //Append reference before sending
        });

    } else if (wholeChapRegex.test(message)) {
        returnMessage = ""

        if (message[0] >= '0' && message[0] <= '9') { //For books with numbers before them
            book = message.split(" ")[0] + " " + message.split(" ")[1].toLowerCase()
            chapter = message.split(" ")[2]
        } else { //All other cases
            book = message.split(" ")[0].toLowerCase()
            chapter = message.split(" ")[1]
        }

        book = checkAbbriev(book)

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

        if (returnMessage == "" || returnMessage === undefined) {
            returnMessage = "Reference not found :("
        }

        if (returnMessage.length > 1900) {
            bot.sendMessage({
                to: channelID,
                message: ("**" + titleCase.titleCase(book) + " " + chapter + "**")
            });
            await new Promise(r => setTimeout(r, 100));

            remainingMessage = returnMessage
            startIndex = 0
            endIndex = 1900

            messageLength = returnMessage.length
            charactersSent = 0;

            messageNum = 1

            while (messageLength - charactersSent > 1900) {
                returnMessage = remainingMessage.slice(startIndex,endIndex) + "-";
                startIndex = startIndex + 1900
                endIndex = endIndex + 1900
                charactersSent = charactersSent + 1900

                bot.sendMessage({
                    to: channelID,
                    message: (returnMessage)
                });
                await new Promise(r => setTimeout(r, 100));

                if (messageNum == 4) {
                    await new Promise(r => setTimeout(r, 5000));
                    messageNum = 0
                }

                messageNum++;
            }

            returnMessage = remainingMessage.slice(startIndex);
            bot.sendMessage({
                to: channelID,
                message: (returnMessage)
            });

        } else {
            bot.sendMessage({
                to: channelID,
                message: ("```**" + titleCase.titleCase(book) + " " + chapter + "**\n" + returnMessage + "```") //Append reference before sending
            });
        }

    } else if (rangeWithinRegex.test(message)) {
        returnMessage = ""

        if (message[0] >= '0' && message[0] <= '9') { //For books with numbers before them
            book = message.split(" ")[0] + " " + message.split(" ")[1].toLowerCase()
            reference = message.split(" ")[2]
        } else { //All other cases
            book = message.split(" ")[0].toLowerCase()
            reference = message.split(" ")[1]
        }

        book = checkAbbriev(book)

        chapter = reference.split(":")[0]
        startVerse = parseInt(reference.split(":")[1].split("-")[0])
        endVerse = parseInt(reference.split(":")[1].split("-")[1])
        currentVerse = startVerse

        console.log(currentVerse)
        console.log(endVerse)

        console.log("Going into the loop...")
        console.log(currentVerse <= endVerse)

        try {
            count = 1
            while (currentVerse <= endVerse) {
                console.log(currentVerse)
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

        if (returnMessage == "" || returnMessage === undefined) {
            returnMessage = "Reference not found :("
        }

        if (returnMessage.length > 1900) {
            bot.sendMessage({
                to: channelID,
                message: ("**" + titleCase.titleCase(book) + " " + reference + "**")
            });
            await new Promise(r => setTimeout(r, 100));

            remainingMessage = returnMessage
            startIndex = 0
            endIndex = 1900

            messageLength = returnMessage.length
            charactersSent = 0;

            messageNum = 1

            while (messageLength - charactersSent > 1900) {
                returnMessage = remainingMessage.slice(startIndex,endIndex) + "-";
                startIndex = startIndex + 1900
                endIndex = endIndex + 1900
                charactersSent = charactersSent + 1900

                bot.sendMessage({
                    to: channelID,
                    message: (returnMessage)
                });
                await new Promise(r => setTimeout(r, 100));

                if (messageNum == 4) {
                    await new Promise(r => setTimeout(r, 5000));
                    messageNum = 0
                }

                messageNum++;
            }

            returnMessage = remainingMessage.slice(startIndex);
            bot.sendMessage({
                to: channelID,
                message: (returnMessage)
            });

        } else {
            bot.sendMessage({
                to: channelID,
                message: ("```**" + titleCase.titleCase(book) + " " + reference + "**\n" + returnMessage + "```") //Append reference before sending
            });
        }
    } else if (rangeAcrossRegex.test(message)) {
        returnMessage = ""

        if (message[0] >= '0' && message[0] <= '9') { //For books with numbers before them
            book = message.split(" ")[0] + " " + message.split(" ")[1].toLowerCase()
            reference = message.split(" ")[2]
        } else { //All other cases
            book = message.split(" ")[0].toLowerCase()
            reference = message.split(" ")[1]
        }

        book = checkAbbriev(book)

        startRef = reference.split("-")[0]
        endRef = reference.split("-")[1]

        startChap = parseInt(startRef.split(":")[0])
        startVerse = parseInt(startRef.split(":")[1])

        endChap = parseInt(endRef.split(":")[0])
        endVerse = parseInt(endRef.split(":")[1])

        //e.g. genesis 3:1-4:12 - would need to somehow find out what is the last verse of the current chapter... and future chapters...


        if (returnMessage.length > 1900) {
            bot.sendMessage({
                to: channelID,
                message: ("**" + titleCase.titleCase(book) + " " + reference + "**")
            });
            await new Promise(r => setTimeout(r, 100));

            remainingMessage = returnMessage
            startIndex = 0
            endIndex = 1900

            messageLength = returnMessage.length
            charactersSent = 0;

            messageNum = 1

            while (messageLength - charactersSent > 1900) {
                returnMessage = remainingMessage.slice(startIndex,endIndex) + "-";
                startIndex = startIndex + 1900
                endIndex = endIndex + 1900
                charactersSent = charactersSent + 1900

                bot.sendMessage({
                    to: channelID,
                    message: (returnMessage)
                });
                await new Promise(r => setTimeout(r, 100));

                if (messageNum == 4) {
                    await new Promise(r => setTimeout(r, 5000));
                    messageNum = 0
                }

                messageNum++;
            }

            returnMessage = remainingMessage.slice(startIndex);
            bot.sendMessage({
                to: channelID,
                message: (returnMessage)
            });

        } else {
            bot.sendMessage({
                to: channelID,
                message: "Sorry, I can't do that yet :("
                //message: ("**" + titleCase.titleCase(book) + " " + reference + "**\n" + returnMessage) //Append reference before sending
            });
        }
    }
});

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
