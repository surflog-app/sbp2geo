import { ReadStream } from 'fs';
import Parser from '../parsers/index';

const SIZE_HEADER = 64; // bytes, octets
const SIZE_CHUNK = 32; // bytes, octets
const SIZE_UPPER = Math.max(SIZE_HEADER, SIZE_CHUNK); // bytes, octets

const STATUS_READ_HEADER = 1;
const STATUS_READ_CHUNK = 2;

const parseReadStream = /* async */ (readStream: ReadStream) => {

    const promiseBody = (resolve: any, reject: any) => {

        const object = {
            'type': 'FeatureCollection',
            'features': new Array<any>(),
        };

        const features = object['features'];

        let feature: any, timesArray, coordinatesArray;

        let firstChunk = true;

        const buffer = Buffer.alloc(SIZE_UPPER);

        const flushFeature = () => {

            if (feature && coordinatesArray.length > 1) {

                features.push(feature);

            }

        };

        const handleCreateFeature = () => {

            flushFeature();

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

        const handleBufferHeader = () => {

            // TODO: parse header

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

        const handleHeader = (data: Buffer) => {

            const sizeRemainingHeader = SIZE_HEADER - sizePartialHeader | 0;

            if (sizeRemainingHeader <= data.length) {

                data.copy(buffer, sizePartialHeader, sizeRemainingHeader);

                handleBufferHeader();

                status = STATUS_READ_CHUNK;

                handleChunk(data, sizeRemainingHeader);

            } else {

                data.copy(buffer, sizePartialHeader);

                sizePartialHeader = sizePartialHeader + data.length | 0;

            }

        };

        const handleChunk = (data: Buffer, offset: number) => {

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

                const trackStart = Parser.isTrackStart(buffer);

                firstChunk = firstChunk || trackStart;

                if (firstChunk) {

                    firstChunk = false;

                    handleCreateFeature();

                } else {

                    handleBufferChunk();

                }

            }

        };

        const handleData = (data: Buffer) => {

            if (status === STATUS_READ_HEADER) {
                handleHeader(data);
            }

            if (status === STATUS_READ_CHUNK) {
                handleChunk(data, 0);
            }

        };

        readStream.on('data', handleData);

        readStream.once('end', () => {

            flushFeature();

            resolve(object);

        });

        readStream.once('error', (error) => {

            reject(error);

        });

    };

    return new Promise<any>(promiseBody);

};

const Streams = Object.freeze({
    parseReadStream,
});

export default Streams;
