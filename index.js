var five = require('johnny-five'),
    Twitter = require('node-twitter'),
    MorseCode = require('morsecode'),
    morseConverter = new MorseCode(),
    keys = require('./twitter_keys.json'),
    board = new five.Board(),
    isBroadcasting = false;

var BPM = 400;

board.on('ready', function() {
  // Creates a piezo object and defines the pin to be used for the signal
  var piezo = new five.Piezo(3);

  // Injects the piezo into the repl
  board.repl.inject({
    piezo: piezo
  });

  registerTweet = function (morseStr, textStr) {
    if (isBroadcasting) return;
    console.log('SENDING:', textStr);

    var message = [],
        duration = 0;

    for (char in morseStr) {
      if (morseStr[char] === '.') {
        message.push(['C4', 1/8]);
        duration += 1/8;
      } else if (morseStr[char] === '_') {
        message.push(['C4', 1]);
        duration += 1;
      }

      if (morseStr[char] !== ' ') {
        message.push(null, 1/8);
        duration += 1/8;
      }
    }

    broadcastTweet(message, duration);
  }

  broadcastTweet = function (message, duration) {
    isBroadcasting = true;

    piezo.play({
      song: message,
      tempo: BPM
    });

    setTimeout( function() {
      // Ready for next tweet
      isBroadcasting = false;
    }, (4*duration*1000)/(BPM/60) + 2000);
  }



  var twitterStreamClient = new Twitter.StreamClient(
    keys.CONSUMER_KEY,
    keys.CONSUMER_SECRET,
    keys.TOKEN_KEY,
    keys.TOKEN_SECRET
  );

  twitterStreamClient.on('error', function(error) {
    console.log('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
  });

  twitterStreamClient.on('tweet', function(tweet) {
    var textStr = tweet.text;
    var morseStr = morseConverter.translate(tweet.text);
    registerTweet(morseStr, textStr);
  });

  twitterStreamClient.start(['teknodrom']);

});
