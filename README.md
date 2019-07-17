## Short description

Small scripts that were used to gather different music data sets. Main file (**index.js**) presents 4 different:
* Getting music data from spotify based on csv input with artist name, track name and source id (to keep data toghether in output file)
* Getting word counts from lyrics downloaded from Musixmatch API, based on csv input file (becareful, quite ugly rate limiting 2,5k request per day, resulting in 1250 lyrics per day)
* Getting word counts from lyrics downloaded from Genius, based on csv input file
* Getting year data from spotify

This whole script set still could be improved. I have used it for my needs, but still there is a lot that can be improved. I have used that with some additional filters on input file, that I threw away from here, because it wasn't generic, it was mainly for my case. But generally its better to search for **Song name** rather than **Song name feat. someone**, simply because some apis will handle better case number one. There are many different problems with input files, but most important things is to make it this way so it will suit your needs.

## Spotify set up

To get clientId and clientSecret you have to register an app on spotify. To do that go to *https://developer.spotify.com/dashboard* . You have to login there and create new app. As soon as you do that client ID should be visible for you and you should be able to get your client secret as well with additional click. While you are there you should also **register your redirect uri, otherwise Spotify will not redirect us to our app after login.**

## How to run

1. Run `npm install` (or alternativaly run `npm ci` to get packages on which I've tested this ;) unless there were some important security updates to packages and I was too lazy too update package-lock.json!)
2. Copy **example.config.json** file and name it **config.json**
3. Fill all varialbles:
    * *axiosTimeout*: you can leave it as it is
    * *spotifyClientId*: spotify client id, duh
    * *spotifyClientSecret*: spotify client secret...
    * *musixmatchApiKey*: you get the idea
4. Run `node index.js` to run my example scenarios or modify it for your needs

## Purpose of that

Scripts were to support upcoming music viz of https://public.tableau.com/profile/kasia.gasiewska.holc#!/ for Tableau IronViz. I encourage you to check out the final result on her Tableau Public page ;)

## Credits

https://github.com/johnwmillr/LyricsGenius - genius part of this was highly based on that library
