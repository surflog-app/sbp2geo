const fs = require('fs');
const SBP2GEO = require('../build/index.js');

function output(result) {
  process.stdout.write(JSON.stringify(result, null, '  '));
}

function main() {
  const inputFile = process.argv[2];
  const streamRead = fs.createReadStream(inputFile);
  SBP2GEO.convertFromStream(streamRead).then(output);
}

if (process.argv.length > 2) {

  main();

} else {

  console.log('Usage: sbp2geo file.sbp > geo.json');

}