const config = require('./config.json');
const { axiosInstance } = require('./axiosInstance');

const WAIT_TIME = 1000 * 30;

async function searchForSingleSongMM(artist, trackName) {
  return axiosInstance.request({
    baseURL: 'http://api.musixmatch.com/ws/1.1/track.search',
    method: 'get',
    params: {
      apikey: config.musixmatchApiKey,
      q_artist: artist,
      q_track: trackName,
      page_size: 1,
      page: 1,
      s_track_rating: 'desc',
      f_has_lyrics: true
    }
  })
    .then(r => {
      return r.data.message.body.track_list.length > 0 ? r.data.message.body.track_list[0].track : null;
    })
    .catch(async e => {
      if (e.code === 503 || e.code === 'ECONNABORTED') {
        await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
        return searchForSingleSong(artist, trackName);
      } else {
        console.error(e);
      }
    });
}

async function getLyricsFromMM(trackId) {
  return axiosInstance.request({
    baseURL: 'http://api.musixmatch.com/ws/1.1/track.lyrics.get',
    method: 'get',
    params: {
      apikey: config.musixmatchApiKey,
      track_id: trackId
    }
  })
    .then(async r => {
      return r.data.message.body.lyrics.lyrics_body;
    })
    .catch(async e => {
      if (e.code === 503 || e.code === 'ECONNABORTED') {
        await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
        return getLyricsFromMM(trackId);
      } else {
        console.error(e);
      }
    });
}

module.exports = {
  searchForSingleSongMM,
  getLyricsFromMM
};
