const csvWriter = require('csv-write-stream');
const fs = require('fs');
const fastCsv = require('fast-csv');
const {
    Scenario1Transformer,
    Scenario2Transformer,
    Scenario3Transformer
} = require('./StreamTransformers');
const { scrapeYearData } = require('./spotifyApi');

async function dataScenario1(inputFile, outputFile, transformConfigurator) {
    const writer = csvWriter();
    writer.pipe(fs.createWriteStream(outputFile));

    return new Promise(resolve => {
        fs.createReadStream(inputFile)
            .pipe(fastCsv.parse({
                headers: true
            }))
            .pipe(new Scenario1Transformer(transformConfigurator))
            .pipe(writer)
            .on('end', () => {
                console.log("Finished");
                resolve();
            });
    });
}

async function dataScenario2(inputFile, outputFile, transformConfigurator) {
    const writer = csvWriter();
    writer.pipe(fs.createWriteStream(outputFile));

    return new Promise(resolve => {
        fs.createReadStream(inputFile)
            .pipe(fastCsv.parse({
                headers: true
            }))
            .pipe(new Scenario2Transformer(transformConfigurator))
            .pipe(writer)
            .on('end', () => {
                console.log("Finished");
                resolve();
            });
    });
}

async function dataScenario3(inputFile, outputFile, transformConfigurator) {
    const writer = csvWriter();
    writer.pipe(fs.createWriteStream(outputFile));

    return new Promise(resolve => {
        fs.createReadStream(inputFile)
            .pipe(fastCsv.parse({
                headers: true
            }))
            .pipe(new Scenario3Transformer(transformConfigurator))
            .pipe(writer)
            .on('end', () => {
                console.log("Finished");
                resolve();
            });
    });
}

async function dataScenario4(outputFile) {
    const writer = csvWriter();
    writer.pipe(fs.createWriteStream(outputFile));
    const results1 = await scrapeYearData(2004);
    results1.forEach(result => writer.write(result));
    const results2 = await scrapeYearData(2005);
    results2.forEach(result => writer.write(result));
    writer.end();
}

async function app() {
    //await dataScenario1('test.csv', 'scenario1Data.csv', { fromRow: 2, toRow: 10, artistColumnName: 'artist', trackColumnName: 'track', sourceIdColumnName: 'id' });
    //await dataScenario2('test.csv', 'scenario2Data.csv', { fromRow: 4, toRow: 7, artistColumnName: 'artist', trackColumnName: 'track', sourceIdColumnName: 'id' });
    //await dataScenario3('test.csv', 'scenario3Data.csv', { fromRow: 1, toRow: 3, artistColumnName: 'artist', trackColumnName: 'track', sourceIdColumnName: 'id' });
    await dataScenario4('scenario4Data.csv');
}

app();