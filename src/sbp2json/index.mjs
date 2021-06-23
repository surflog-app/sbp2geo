import Generators from './generators.mjs';
import Streams from './streams.mjs';

export const convertFromDescriptor = async (fileDescriptor) => {

    const object = {
        'type': 'FeatureCollection',
        'features': [],
    };

    const features = object['features'];

    const tracksStream = Generators.tracksDescriptor(fileDescriptor);

    for await (const track of tracksStream) {

        features.push(track);

    }

    return object;

};

export const convertFromStream = async (readStream) => {

    return await Streams.parseReadStream(readStream);

};

const SBP2JSON = Object.freeze({
    convertFromDescriptor,
    convertFromStream,
});

export default SBP2JSON;