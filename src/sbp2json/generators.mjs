import fs from 'fs';
import Parser from './parser.mjs';

const SIZE_HEADER = 64; // bytes, octets
const SIZE_CHUNK = 32; // bytes, octets
const SIZE_UPPER = Math.max(SIZE_HEADER, SIZE_CHUNK); // bytes, octets

const parseHeader = (chunkHeader) => {

    // TODO: parse header
    return Object.freeze({});

};

export const ERROR_INCORRECT_HEADER_SIZE = 'incorrect size for header!';
export const ERROR_INVALID_HEADER = 'invalid header inside file!';

const nextChunk = (fileDescriptor, outputBuffer, chunkLength) => {

    const callback = (resolve, reject) => (error, bytesRead) => {

        if (error) {
            reject(error);
            return;
        }

        resolve(bytesRead);

    };

    const promiseBody = (resolve, reject) => {

        fs.read(
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

export async function* chunksDescriptor(fileDescriptor) {

    const buffer = Buffer.alloc(SIZE_UPPER);

    // reads header from file descriptor
    const bytesRead = await nextChunk(fileDescriptor, buffer, SIZE_HEADER);

    if (bytesRead !== SIZE_HEADER) { // failed to fully read header
        throw new Error(ERROR_INCORRECT_HEADER_SIZE);
    }

    // if failed to parse header
    if (!parseHeader(buffer)) {
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

export async function* tracksDescriptor(fileDescriptor) {

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

    const chunkStream = chunksDescriptor(fileDescriptor);

    await chunkStream.next(); // ignores header

    const { value: startChunk, done } = await chunkStream.next();

    if (done) {
        return;
    }

    const feature = createFeature(startChunk);

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
    chunksDescriptor,
    tracksDescriptor,
});

export default Generators;