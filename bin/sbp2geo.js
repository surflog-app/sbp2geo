#!/usr/bin/env node
'use strict';

var fs = require('fs');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);

// 8-bit integer, little-endian
const I8LE = (buffer, offset) => {

    const rawNumber = buffer[offset] | 0;

    return (rawNumber << 24 >> 24);

};

// 8-bit unsigned, little-endian
const U8LE = (buffer, offset) => {

    const rawNumber = buffer[offset] | 0;

    return rawNumber;

};

// 16-bit integer, little-endian
const I16LE = (buffer, offset) => {

    const rawA = buffer[offset + 0 | 0] << 0;
    const rawB = buffer[offset + 1 | 0] << 8;

    const rawNumber = rawA | rawB;

    return (rawNumber << 16 >> 16);

};

// 16-bit integer, little-endian
const U16LE = (buffer, offset) => {

    const rawA = buffer[offset + 0 | 0] << 0;
    const rawB = buffer[offset + 1 | 0] << 8;

    const rawNumber = rawA | rawB;

    return rawNumber;

};

// 32-bit integer, little-endian
const I32LE = (buffer, offset) => {

    const rawA = buffer[offset + 0 | 0] <<  0;
    const rawB = buffer[offset + 1 | 0] <<  8;
    const rawC = buffer[offset + 2 | 0] << 16;
    const rawD = buffer[offset + 3 | 0] << 24;

    const rawNumber = rawA | rawB | rawC | rawD;

    return rawNumber;

};

// 32-bit unsigned, little-endian
const U32LE = (buffer, offset) => {

    const rawA = buffer[offset + 0 | 0] <<  0;
    const rawB = buffer[offset + 1 | 0] <<  8;
    const rawC = buffer[offset + 2 | 0] << 16;
    const rawD = buffer[offset + 3 | 0] << 24;

    const rawNumber = rawA | rawB | rawC | rawD;

    return rawNumber >>> 0;

};

const Integers = Object.freeze({
    I8LE,
    U8LE,
    I16LE,
    U16LE,
    I32LE,
    U32LE,
});

const chunkName = (chunk) => {

    const date = chunkDate(chunk);

    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const hour = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const seconds = date.getUTCSeconds();

    return [year, month, day, hour, minutes, seconds].join("");

};

const chunkDate = (chunk) => {

    const MASK_A = 0x0000003F; // seconds
    const MASK_B = 0x00000FC0; // minutes
    const MASK_C = 0x0001F000; // hours
    const MASK_D = 0x003E0000; // month day
    const MASK_E = 0xFFC00000; // months

    const packedDate = Integers.U32LE(chunk, 4);

    const dataA = (packedDate & MASK_A) >>>  0;
    const dataB = (packedDate & MASK_B) >>>  6;
    const dataC = (packedDate & MASK_C) >>> 12;
    const dataD = (packedDate & MASK_D) >>> 17;
    const dataE = (packedDate & MASK_E) >>> 22;

    const seconds = dataA;
    const minutes = dataB;
    const hours = dataC;
    const day = dataD;
    const month = dataE % 12 | 0;
    const years = dataE / 12 | 0;

    const date = new Date();
    date.setUTCSeconds(seconds);
    date.setUTCMinutes(minutes);
    date.setUTCHours(hours);
    date.setUTCFullYear(2000 + years | 0, month, day);

    return date;

};

const chunkTime = (chunk) => {

    const date = chunkDate(chunk);

    return date.toISOString();

};

const chunkCoordinates = (chunk) => {

    const latitude = Integers.I32LE(chunk, 12);
    const longitude = Integers.I32LE(chunk, 16);
    const altitude = Integers.I32LE(chunk, 20);

    return Object.freeze([
        longitude / 10000000,
        latitude  / 10000000,
        altitude  / 100,
    ]);

};

const isTrackStart = (chunk) => {

    const flags = chunk[30];

    return (flags & 1) !== 0;

};

const Parser = Object.freeze({
    chunkName,
    chunkDate,
    chunkTime,
    chunkCoordinates,
    isTrackStart,
});

const SIZE_HEADER = 64; // bytes, octets
const SIZE_CHUNK = 32; // bytes, octets
const SIZE_UPPER = Math.max(SIZE_HEADER, SIZE_CHUNK); // bytes, octets

const parseHeader = (chunkHeader) => {

    // TODO: parse header
    return Object.freeze({});

};

const ERROR_INCORRECT_HEADER_SIZE = 'incorrect size for header!';
const ERROR_INVALID_HEADER = 'invalid header inside file!';

const nextChunk = (fileDescriptor, outputBuffer, chunkLength) => {

    const callback = (resolve, reject) => (error, bytesRead) => {

        if (error) {
            reject(error);
            return;
        }

        resolve(bytesRead);

    };

    const promiseBody = (resolve, reject) => {

        fs__default['default'].read(
            fileDescriptor,
            outputBuffer,
            0,
            chunkLength,
            null,
            callback(resolve, reject),
        );

    };

    return new Promise(promiseBody);

};

async function* chunksGenerator(fileDescriptor) {

    const buffer = Buffer.alloc(SIZE_UPPER);

    // reads header from file descriptor
    const bytesRead = await nextChunk(fileDescriptor, buffer, SIZE_HEADER);

    if (bytesRead !== SIZE_HEADER) { // failed to fully read header
        throw new Error(ERROR_INCORRECT_HEADER_SIZE);
    }

    // if failed to parse header
    if (!parseHeader()) {
        throw new Error(ERROR_INVALID_HEADER);
    }

    // yields the header chunk (32 bytes)
    yield buffer;

    let chunksLeft = true;

    while (chunksLeft) {

        const bytesRead = await nextChunk(fileDescriptor, buffer, SIZE_CHUNK);

        if (bytesRead === 0) { // no more chunks to be read
            break;
        }

        if (bytesRead !== SIZE_CHUNK) { // failed to fully read an entry
            throw new Error();
        }

        // yields the received chunk (64 bytes)
        yield buffer;

    }

}

async function* tracksGenerator(fileDescriptor) {

    const createFeature = (startChunk) => {

        const name = Parser.chunkName(startChunk);
        const time = Parser.chunkTime(startChunk);
        const coordinates = Parser.chunkCoordinates(startChunk);
    
        const feature = {
            'type': 'Feature',
            'properties': {
                'name': name,
                'time': time,
                'coordTimes': [time],
            },
            'geometry': {
                'type': 'LineString',
                'coordinates': [coordinates],
            },
        };
    
        return feature;
    
    };

    const chunkStream = chunksGenerator(fileDescriptor);

    await chunkStream.next(); // ignores header

    const { value: startChunk, done } = await chunkStream.next();

    if (done) {
        return;
    }

    let feature = createFeature(startChunk);

    const timesArray = feature['properties']['coordTimes'];
    const coordinatesArray = feature['geometry']['coordinates'];

    for await (const chunk of chunkStream) {

        const time = Parser.chunkTime(chunk);
        const coordinates = Parser.chunkCoordinates(chunk);
    
        timesArray.push(time);
        coordinatesArray.push(coordinates);

    }

    yield feature;

}

const Generators = Object.freeze({
    ERROR_INCORRECT_HEADER_SIZE,
    ERROR_INVALID_HEADER,
    nextChunk,
    chunksGenerator,
    tracksGenerator,
});

const convertFile = async (fileDescriptor) => {

    const object = {
        'type': 'FeatureCollection',
        'features': [],
    };

    const features = object['features'];

    const tracksStream = Generators.tracksGenerator(fileDescriptor);

    for await (const track of tracksStream) {

        features.push(track);

    }

    return object;

};

const SBP2JSON = Object.freeze({
    convertFile,
});

const main = (argc, argv) => {

    if (argc !== 4) {
        console.log('Usage: node main.mjs <input-file> <output-file>');
        return;
    }

    const inputFile = argv[2];
    const outputFile = argv[3];

    const open = (fileName, flags) => {

        return new Promise((resolve, reject) => {

            fs__default['default'].open(fileName, flags, (error, fileDescriptor) => {

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

            fs__default['default'].writeFile(fileName, content, (error) => {

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
