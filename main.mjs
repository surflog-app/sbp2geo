import fs from 'fs';
import SBP2JSON from './sources/sbp2json/index.mjs';

const main = (argc, argv) => {

    if (argc !== 4) {
        console.log('Usage: node main.mjs <input-file> <output-file>');
        return;
    }

    const inputFile = argv[2];
    const outputFile = argv[3];

    const open = (fileName, flags) => {

        return new Promise((resolve, reject) => {

            fs.open(fileName, flags, (error, fileDescriptor) => {

                if (error) {

                    reject(error);

                } else {

                    resolve(fileDescriptor);

                }
                
            });

        });

    };

    const write = (fileName, content) => {

        return new Promise((resolve, reject) => {

            fs.writeFile(fileName, content, (error) => {

                if (error) {

                    reject(error);

                } else {

                    resolve();

                }

            });

        });

    };

    const promise = (async () => {

        const fileDescriptor = await open(inputFile, 'r');

        const object = await SBP2JSON.convertFile(fileDescriptor);

        const content = JSON.stringify(object, null, 2);

        await write(outputFile, content);

    })();

    promise.catch((error) => {
        console.error('[ERROR]: ', error);
    });

};

main(process.argv.length, process.argv);