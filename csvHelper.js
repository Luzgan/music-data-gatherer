const fs = require('fs');
const csv = require('fast-csv');

async function readCSV(file) {
    const dataBucket = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(file)
            .pipe(csv.parse({
                headers: true
            }))
            .on('data', (data) => {
                dataBucket.push(data);
            })
            .on('end', () => {
                resolve(dataBucket);
            });
    })
};

module.exports = {
    readCSV
}