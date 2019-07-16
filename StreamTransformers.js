const { searchForSingleSong, getDetailedTrackData } = require('./spotifyApi');
const { searchForSingleSongMM, getLyricsFromMM } = require('./musixmatchApi');
const { getSongGenius, scrapeGeniusLyrics } = require('./geniusApi');
const { spotifyFormat, spotifyDetailedFormat, splitWords, formatWords } = require('./fotmatters');
const {
    Transform
} = require('stream');

class AbstractSongTransforer extends Transform {
    constructor(config) {
        super({
            readableObjectMode: true,
            writableObjectMode: true,
            ...config
        });
        this.iterator = 0;
        this.artistColumnName = config.artistColumnName;
        this.trackColumnName = config.trackColumnName;
        this.sourceIdColumnName = config.sourceIdColumnName;
        this.toRow = config.toRow;
        this.fromRow = config.fromRow;
    }

    shouldProcessRow() {
        return (this.fromRow === 0 || this.fromRow <= this.iterator) && (this.toRow === 0 || this.toRow >= this.iterator);
    }

    incrementRow() {
        this.iterator++;
    }

    getSourceId(chunk) {
        return chunk[this.sourceIdColumnName];
    }

    getArtistName(chunk) {
        return chunk[this.artistColumnName];
    }

    getTrackName(chunk) {
        return chunk[this.trackColumnName];
    }

    dealWithRow(func, callback) {
        this.incrementRow();
        Promise.resolve()
            .then(async () => {
                if (this.shouldProcessRow()) {
                    return func();
                }
            })
            .then(callback);
    }
}

class Scenario1Transformer extends AbstractSongTransforer {
    _transform(chunk, encoding, callback) {
        this.dealWithRow(async () => {
            const track = await searchForSingleSong(this.getArtistName(chunk), this.getTrackName(chunk));
            if (!track) return;

            const detailedTrackData = await getDetailedTrackData(track.id);
            if (!detailedTrackData) return;

            this.push(
                spotifyDetailedFormat(
                    spotifyFormat(track, this.getSourceId(chunk)),
                    detailedTrackData
                )
            )
        }, callback);
    }
}

class Scenario2Transformer extends AbstractSongTransforer {
    _transform(chunk, encoding, callback) {
        this.dealWithRow(async () => {
            const track = await searchForSingleSongMM(this.getArtistName(chunk), this.getTrackName(chunk));
            if (!track) return;

            const lyrics = await getLyricsFromMM(track.track_id);
            if (!lyrics) return;

            const words = await splitWords(lyrics);
            const formattedWords = formatWords(this.getSourceId(chunk), words);
            formattedWords.forEach((wordRow) => this.push(wordRow));
        }, callback);
    }
}

class Scenario3Transformer extends AbstractSongTransforer {
    _transform(chunk, encoding, callback) {
        this.dealWithRow(async () => {
            const track = await getSongGenius(this.getArtistName(chunk), this.getTrackName(chunk));
            if (!track) return;

            const lyrics = await scrapeGeniusLyrics(track.url);
            if (!lyrics) return;

            const words = await splitWords(lyrics);
            const formattedWords = formatWords(this.getSourceId(chunk), words);
            formattedWords.forEach((wordRow) => this.push(wordRow));
        }, callback);
    }
}

module.exports = {
    Scenario1Transformer,
    Scenario2Transformer,
    Scenario3Transformer
}