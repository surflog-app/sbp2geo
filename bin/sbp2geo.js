#!/usr/bin/env node
'use strict';

var fs = require('fs');

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

const STATUS_READ_HEADER = 1;
const STATUS_READ_CHUNK = 2;

const parseReadStream$1 = /* async */ (readStream) => {

    const promiseBody = (resolve, reject) => {

        let feature, timesArray, coordinatesArray;

        let firstChunk = true;

        const buffer = Buffer.alloc(SIZE_UPPER);

        const handleCreateFeature = () => {

            const name = Parser.chunkName(buffer);
            const time = Parser.chunkTime(buffer);
            const coordinates = Parser.chunkCoordinates(buffer);

            feature = {
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

            timesArray = feature['properties']['coordTimes'];
            coordinatesArray = feature['geometry']['coordinates'];

        };

        const handleBufferChunk = () => {

            const time = Parser.chunkTime(buffer);
            const coordinates = Parser.chunkCoordinates(buffer);

            timesArray.push(time);
            coordinatesArray.push(coordinates);

        };

        let status = STATUS_READ_HEADER;

        let sizePartialHeader = 0;
        let sizePartialChunk = 0;

        const handleHeader = (data) => {

            const sizeRemainingHeader = SIZE_HEADER - sizePartialHeader | 0;

            if (sizeRemainingHeader <= data.length) {

                data.copy(buffer, sizePartialHeader, sizeRemainingHeader);

                status = STATUS_READ_CHUNK;

                handleChunk(data, sizeRemainingHeader);

            } else {

                data.copy(buffer, sizePartialHeader);

                sizePartialHeader = sizePartialHeader + data.length | 0;

            }

        };

        const handleChunk = (data, offset) => {

            while (true) {

                const sizeReceived = data.length - offset | 0;

                const sizeRemainingChunk = SIZE_CHUNK - sizePartialChunk | 0;

                if (sizeReceived < SIZE_CHUNK) {

                    data.copy(
                        buffer,
                        sizePartialChunk,
                        offset,
                    );

                    sizePartialChunk = sizePartialChunk + sizeReceived | 0;

                    break;

                }

                const nextOffset = offset + sizeRemainingChunk | 0;

                data.copy(
                    buffer,
                    sizePartialChunk,
                    offset,
                    nextOffset,
                );

                offset = nextOffset;

                sizePartialChunk = 0;

                if (firstChunk) {

                    firstChunk = false;

                    handleCreateFeature();

                } else {

                    handleBufferChunk();

                }

            }

        };

        // let absoluteOffset = 0;

        const handleData = (data) => {

            // console.log('absoluteOffset: ', absoluteOffset);
            // absoluteOffset += data.length;

            if (status === STATUS_READ_HEADER) {
                handleHeader(data);
            }

            if (status === STATUS_READ_CHUNK) {
                handleChunk(data, 0);
            }

        };

        readStream.on('data', handleData);

        readStream.once('end', () => {

            const object = {
                'type': 'FeatureCollection',
                'features': [feature],
            };

            resolve(object);

        });

        readStream.once('error', (error) => {

            reject(error);

        });

    };

    return new Promise(promiseBody);

};

const Streams = Object.freeze({
    parseReadStream: parseReadStream$1,
});

const { parseReadStream } = Streams;

function output(result) {
  process.stdout.write(JSON.stringify(result, null, '  '));
}

function main() {
  const inputFile = process.argv[2];
  const streamRead = fs.createReadStream(inputFile);
  parseReadStream(streamRead).then(output);
}

if (process.argv.length >= 2) {
  main();
} else {
  console.log('Usage: sbp2geo file.sbp > geo.json');
}
