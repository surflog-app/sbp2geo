import Generators from './generators.mjs';

export const convertFile = async (fileDescriptor) => {

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

export default SBP2JSON;