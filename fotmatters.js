const _ = require('lodash');
const { readCSV } = require('./csvHelper');

function spotifyFormat(track, sourceId = 'no_source_id') {
    return {
        source_id: sourceId,
        name: _.get(track, 'name'),
        album_name: _.get(track, 'album.name'),
        artist_name: _.get(track, 'artists[0].name'),
        album_release_date: _.get(track, 'album.release_date'),
        album_tracks: _.get(track, 'album.total_tracks'),
        artist_main_genre: _.get(track, 'artists[0].genres[0]'),
        disc_number: _.get(track, 'disc_number'),
        track_number: _.get(track, 'track_number'),
        duration_ms: _.get(track, 'duration_ms'),
        explicit: _.get(track, 'explicit'),
        spotify_id: _.get(track, 'id'),
        popularity: _.get(track, 'popularity')
    };
}

function spotifyDetailedFormat(track, detailedData) {
    return {
        ...track,
        key: _.get(detailedData, 'key'),
        mode: _.get(detailedData, 'mode'),
        time_signature: _.get(detailedData, 'time_signature'),
        acousticness: _.get(detailedData, 'acousticness'),
        danceability: _.get(detailedData, 'danceability'),
        energy: _.get(detailedData, 'energy'),
        instrumentalness: _.get(detailedData, 'instrumentalness'),
        liveness: _.get(detailedData, 'liveness'),
        loudness: _.get(detailedData, 'loudness'),
        speechiness: _.get(detailedData, 'speechiness'),
        valence: _.get(detailedData, 'valence'),
        tempo: _.get(detailedData, 'tempo')
    }
}

function spotifyYearFormat(track, extendedTrackData, artist) {
    return {
        album_name: _.get(track, 'album.name'),
        album_release_date: _.get(track, 'album.release_date'),
        album_tracks: _.get(track, 'album.total_tracks'),
        artist_name: _.get(track, 'artists', []).map(artist => artist.name).join(', '),
        disc_number: _.get(track, 'disc_number'),
        track_number: _.get(track, 'track_number'),
        duration_ms: _.get(track, 'duration_ms'),
        explicit: _.get(track, 'explicit'),
        id: _.get(track, 'id'),
        name: _.get(track, 'name'),
        popularity: _.get(track, 'popularity'),
        key: _.get(extendedTrackData, 'key'),
        mode: _.get(extendedTrackData, 'mode'),
        time_signature: _.get(extendedTrackData, 'time_signature'),
        acousticness: _.get(extendedTrackData, 'acousticness'),
        danceability: _.get(extendedTrackData, 'danceability'),
        energy: _.get(extendedTrackData, 'energy'),
        instrumentalness: _.get(extendedTrackData, 'instrumentalness'),
        liveness: _.get(extendedTrackData, 'liveness'),
        loudness: _.get(extendedTrackData, 'loudness'),
        speechiness: _.get(extendedTrackData, 'speechiness'),
        valence: _.get(extendedTrackData, 'valence'),
        tempo: _.get(extendedTrackData, 'tempo'),
        artist_genre: _.get(artist, 'genres[0]')
    }
}

async function splitWords(lyrics) {
    lyrics = lyrics
        .replace(/\*\*\*\*\*\*\* This Lyrics is NOT for Commercial use \*\*\*\*\*\*\*/g, '')
        .replace(/\[.*?]/g, '')
        .toLowerCase()
        .replace(/[0-9\n()*\.",-?!#…]/g, " ")
        .replace(/\(?instrumental\)?/ig, ' ')
        .replace(/\s\s+/g, ' ')
        .trim();

    const csvContents = await readCSV('stopwords.csv');
    csvContents.forEach((data) => {
        const word = data.word;
        lyrics = lyrics.replace(new RegExp(`^${word}\\s|\\s${word}\\s|\\s${word}$`, 'g'), ' ');
    });

    return lyrics
        .split(' ');
}

function formatWords(sourceId, words) {
    words = _.compact(words);
    const buckets = _.reduce(words, (buckets, word) => {
        if (word.length > 2) {
            if (buckets[word]) {
                buckets[word]++;
            } else {
                buckets[word] = 1;
            }
        }

        return buckets;
    }, {});

    return _.map(buckets, (value, key) => {
        return {
            source_id: sourceId,
            word: key,
            count: value
        }
    });
}

module.exports = {
    formatWords,
    splitWords,
    spotifyDetailedFormat,
    spotifyFormat,
    spotifyYearFormat
}