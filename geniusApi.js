const { axiosInstance } = require('./axiosInstance');
const _ = require('lodash');
const {
    parse
} = require('node-html-parser');
const queryString = require('query-string');

const WAIT_TIME = 1000 * 30;

function isSong(songTitle) {
    return !new RegExp("/track\s?list|album art(work)?|liner notes|booklet|credits|interview|skit|instrumental|setlist/", 'i').test(songTitle);
}

async function getSongGenius(artist, track) {
    const query = `${track} ${artist}`;
    return axiosInstance.request({
        baseURL: 'https://genius.com/api/search/multi',
        method: 'get',
        params: {
            per_page: 5,
            q: query
        },
        paramsSerializer: (params) => {
            return queryString.stringify(params);
        }
    })
        .then(async r => {
            const songs = _.find(r.data.response.sections, section => section.type === 'song').hits.map(s => s.result);
            if (songs) {
                return songs.find(s => isSong(s.title));
            }

            return null;
        })
        .catch(async e => {
            if (e.code === 503 || e.code === 'ECONNABORTED') {
                await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
                return getSongGenius(artist, song);
            }

            console.error(e);
        })
}

async function scrapeGeniusLyrics(url) {
    return axiosInstance.get(url)
        .then(r => {
            const root = parse(r.data);
            return root.querySelector('.lyrics').text;
        })
        .catch(async e => {
            if (e.code === 503 || e.code === 'ECONNABORTED') {
                await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
                return scrapeGeniusLyrics(url);
            }

            console.error(e);
        })
}

module.exports = {
    getSongGenius,
    scrapeGeniusLyrics
}