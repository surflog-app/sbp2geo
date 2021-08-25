import { FileHandle } from 'fs/promises';
import Parser from '../parsers/index';
import Constants from '../shared/constants';

const { SIZE_CHUNK, SIZE_HEADER } = Constants;

const parseHeader = (chunkHeader: Buffer) => {

    // TODO: parse header
    return Object.freeze({});

};

export const ERROR_INCORRECT_HEADER_SIZE = 'incorrect size for header!';
export const ERROR_INVALID_HEADER = 'invalid header inside file!';

const nextChunk = async (file: FileHandle, buffer: Buffer) => {

  const { bytesRead } = await file.read({ buffer });

  return bytesRead;

};

export async function* chunksDescriptor(file: FileHandle) {

    const bufferHeader = Buffer.alloc(SIZE_HEADER);

    // reads header from file descriptor
    const bytesRead = await nextChunk(file, bufferHeader);

    if (bytesRead !== SIZE_HEADER) { // failed to fully read header
        throw new Error(ERROR_INCORRECT_HEADER_SIZE);
    }

    // if failed to parse header
    if (!parseHeader(bufferHeader)) {
        throw new Error(ERROR_INVALID_HEADER);
    }

    // yields the header chunk (64 bytes)
    yield bufferHeader;

    const bufferChunk = Buffer.alloc(SIZE_CHUNK);
    let chunksLeft = true;

    while (chunksLeft) {

        const bytesRead = await nextChunk(file, bufferChunk);

        if (bytesRead === 0) { // no more chunks to be read
            break;
        }

        if (bytesRead !== SIZE_CHUNK) { // failed to fully read an entry
            throw new Error();
        }

        // yields the received chunk (32 bytes)
        yield bufferChunk;

    }

}

export async function* tracksDescriptor(file: FileHandle) {

    const createFeature = (startChunk: Buffer) => {

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

    const chunkStream = chunksDescriptor(file);

    await chunkStream.next(); // ignores header

    const { value, done } = await chunkStream.next();

    if (done) {
        return;
    }

    const startChunk = value as Buffer;

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