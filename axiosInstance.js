const axios = require('axios');
const config = require('./config.json');

const axiosInstance = axios.create({
    timeout: config.axiosTimeout
});

module.exports = {
    axiosInstance
}