const fs = require('fs');
const fsPromises = require('fs/promises');
const SBP2GEO = require('../build/index.js');

function output(result) {
  process.stdout.write(JSON.stringify(result, null, '  '));
}

function main() {

  const promise = (async () => {

    const inputFile = process.argv[2];
    const fileDescriptor = await fsPromises.open(inputFile, 'r');
    const result = await SBP2GEO.convertFromDescriptor(fileDescriptor);

    output(result);

  })();

  promise.catch((error) => {

    console.log('[ERROR]: ', error);
    console.log(error.stack);

  });

}

if (process.argv.length > 2) {

  main();

} else {

  console.log('Usage: sbp2geo file.sbp > geo.json');

}