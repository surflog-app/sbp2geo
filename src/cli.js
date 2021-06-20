import { createReadStream, createWriteStream } from 'fs';
import SBP2JSON from './sbp2json/index.mjs';

const main = (argc, argv) => {

  if (argc !== 4) {
    console.log('Usage: node main.mjs <input-file> <output-file>');
    return;
  }

  const inputFile = argv[2];
  const outputFile = argv[3];

  const streamRead = createReadStream(inputFile);
  const streamWrite = createWriteStream(outputFile);
  streamRead.pipe(streamWrite);
  // SBP2JSON.convertStream(streamRead, streamWrite);
  streamWrite.on('finish', () => {
    console.log('All writes are now complete.');
  });

};

main(process.argv.length, process.argv);
