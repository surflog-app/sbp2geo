import { createReadStream } from 'fs';
import sbp2json from './sbp2json/streams.mjs';

const { parseReadStream } = sbp2json;

function output(result) {
  process.stdout.write(JSON.stringify(result, null, '  '));
}

function main() {
  const inputFile = process.argv[2];
  const streamRead = createReadStream(inputFile);
  parseReadStream(streamRead).then(output);
}

if (process.argv.length > 2) {
  main();
} else {
  console.log('Usage: sbp2geo file.sbp > geo.json');
}
