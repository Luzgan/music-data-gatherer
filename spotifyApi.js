const config = require('./config.json');
const _ = require('lodash');
const queryString = require('query-string');
const { axiosInstance } = require('./axiosInstance');
const { spotifyYearFormat } = require('./fotmatters');

const WAIT_TIME = 1000 * 30;

function getHeader(token) {
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded'
    };
}

let tokens = null;
async function getCachedToken() {
    if (tokens) {
        return tokens;
    }

    tokens = await getClientToken();
    return tokens;
}

async function getClientToken() {
    const data = {
        grant_type: 'client_credentials'
    };
    return axiosInstance.request({
        baseURL: 'https://accounts.spotify.com/api/token',
        method: 'post',
        headers: {
            'Authorization': `Basic ${Buffer.from(`${config.spotifyClientId}:${config.spotifyClientSecret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: queryString.stringify(data)
    })
        .then(r => r.data)
        .catch(e => {
            console.error(e);
        });
}

async function refreshToken(refreshToken) {
    const data = {
        grant_type: 'refresh_token',
        refresh_token: refreshToken
    };
    return axiosInstance.request({
        baseURL: 'https://accounts.spotify.com/api/token',
        method: 'post',
        headers: {
            'Authorization': `Basic ${Buffer.from(`${config.spotifyClientId}:${config.spotifyClientSecret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: queryString.stringify(data)
    })
        .then(r => {
            tokens = r.data;
            return tokens;
        })
        .catch(e => {
            console.error(e);
        });
}

async function searchForSingleSong(artist, track) {
    const tokens = await getCachedToken();
    const q = `artist:${artist} AND track:"${track}"`;
    const params = {
        q,
        type: 'track',
        limit: 1
    };

    return axiosInstance.request({
        baseURL: 'https://api.spotify.com/v1/search',
        headers: getHeader(tokens.access_token),
        method: 'get',
        params,
        paramsSerializer: (params) => {
            return queryString.stringify(params);
        }
    })
        .then(r => {
            return r.data.tracks.items.length > 0 ? r.data.tracks.items[0] : null;
        })
        .catch(async e => {
            if (e.code === 503 || e.code === 'ECONNABORTED') {
                await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
                return searchForSingleSong(artist, track, tokens);
            } else if (e.code === 401) {
                const newTokens = await refreshToken(tokens.refresh_token);
                return searchForSingleSong(artist, track, newTokens);
            } else {
                console.error(e);
            }
        });
}

async function getDetailedTrackData(trackId) {
    const tokens = await getCachedToken();
    return axiosInstance.request({
        baseURL: `https://api.spotify.com/v1/audio-features/${trackId}`,
        headers: getHeader(tokens.access_token),
        method: 'get',
    })
        .then(r => {
            return r.data;
        })
        .catch(async e => {
            if (e.code === 503 || e.code === 'ECONNABORTED') {
                await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
                return detailedTrackData(trackId, tokens);
            } else if (e.code === 401) {
                const newTokens = await refreshToken(tokens.refresh_token);
                return detailedTrackData(trackId, newTokens);
            } else {
                console.error(e);
            }
        });
}

async function spotifySearchYearCrawler(params, amountPerYear, tokens, page = 1) {
    return axiosInstance.request({
        baseURL: 'https://api.spotify.com/v1/search',
        headers: getHeader(tokens.access_token),
        method: 'get',
        params: {
            ...params,
            offset: (page - 1) * params.limit
        },
        paramsSerializer: (params) => {
            return queryString.stringify(params);
        }
    })
        .then(async r => {
            if (r.data.tracks.next && page * params.limit < amountPerYear) {
                const tracks = await spotifySearchYearCrawler(params, amountPerYear, tokens, page + 1);
                return _.concat(r.data.tracks.items, tracks);
            } else {
                return r.data.tracks.items;
            }
        })
        .catch(async e => {
            if (e.code === 503 || e.code === 'ECONNABORTED') {
                await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
                return spotifySearchYearCrawler(params, amountPerYear, tokens, page);
            } else if (e.code === 401) {
                const newTokens = await refreshToken(tokens.refresh_token);
                return spotifySearchYearCrawler(trackId, amountPerYear, newTokens, page);
            } else {
                console.error(e);
            }
        })
}

async function searchForYear(year, amountPerYear) {
    const tokens = await getCachedToken();
    const q = `year:${year}`;
    const params = {
        q,
        type: 'track',
        limit: 50
    };

    return spotifySearchYearCrawler(params, amountPerYear, tokens);
}

async function getTracksAudioFeaturesRequest(ids, tokens) {
    return axiosInstance.request({
        baseURL: `https://api.spotify.com/v1/audio-features`,
        headers: getHeader(tokens.access_token),
        method: 'get',
        params: {
            ids: _.slice(ids, 0, 50)
        },
        paramsSerializer: (params) => {
            return queryString.stringify(params, {
                arrayFormat: 'comma'
            });
        }
    })
        .then(r => r.data.audio_features)
        .catch(async e => {
            if (e.code === 503 || e.code === 'ECONNABORTED') {
                await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
                return getTracksAudioFeaturesRequest(ids, tokens);
            } else if (e.code === 401) {
                const newTokens = await refreshToken(tokens.refresh_token);
                return getTracksAudioFeaturesRequest(ids, newTokens);
            } else {
                console.error(e);
            }
        });
}

async function getTracksAudioFeatures(ids) {
    const tokens = await getCachedToken();
    const idsChunks = _.chunk(ids, 50);
    let extendedData = [];
    for (let i = 0; i < idsChunks.length; i++) {
        extendedData = _.concat(extendedData, await getTracksAudioFeaturesRequest(idsChunks[i], tokens));
    }

    return extendedData;
}

async function getArtistsRequest(ids) {
    return axiosInstance.request({
        baseURL: `https://api.spotify.com/v1/artists`,
        headers: getHeader(tokens.access_token),
        method: 'get',
        params: {
            ids: _.slice(ids, 0, 50)
        },
        paramsSerializer: (params) => {
            return queryString.stringify(params, {
                arrayFormat: 'comma'
            });
        }
    })
        .then(r => r.data.artists)
        .catch(async e => {
            if (e.code === 503 || e.code === 'ECONNABORTED') {
                await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
                return getArtistsRequest(params, tokens);
            } else if (e.code === 401) {
                const newTokens = await refreshToken(tokens.refresh_token);
                return getArtistsRequest(trackId, newTokens);
            } else {
                console.error(e);
            }
        });
}

async function getArtists(ids) {
    const tokens = await getCachedToken();
    const idsChunks = _.chunk(ids, 50);
    let artists = [];
    for (let i = 0; i < idsChunks.length; i++) {
        artists = _.concat(artists, await getArtistsRequest(idsChunks[i]), tokens);
    }

    return artists;
}

const extractArtistIdFromTrack = (trackData) => _.get(trackData, 'artists[0].id');
const extractIdFromTrack = (trackData) => _.get(trackData, 'id');

function filterAndFormatTracks(tracksData, audioFeaturesOfTracks, artists) {
    const results = [];
    for (let i = 0; i < audioFeaturesOfTracks.length; i++) {
        const track = _.find(tracksData, (t) => t.id === audioFeaturesOfTracks[i].id);
        const artist = _.find(artists, (a) => a.id === extractArtistIdFromTrack(track));
        results.push(
            spotifyYearFormat(
                track,
                audioFeaturesOfTracks[i],
                artist
            )
        );
    }

    return results;
}

async function scrapeYearData(year, amountPerYear = 100) {
    const yearTrackData = await searchForYear(year, amountPerYear);
    const artistsIds = yearTrackData.map(extractArtistIdFromTrack);
    const trackIds = yearTrackData.map(extractIdFromTrack);
    const audioFeaturesForTracks = _.compact(await getTracksAudioFeatures(trackIds));
    const artists = _.compact(await getArtists(artistsIds));

    const results = filterAndFormatTracks(yearTrackData, audioFeaturesForTracks, artists);
    return results;
}

module.exports = {
    searchForSingleSong,
    getDetailedTrackData,
    scrapeYearData
}