import Generators from './generators/index';
import Streams from './streams/index';

import { FileHandle } from "fs/promises";
import { ReadStream } from 'fs';

export const convertFromDescriptor = async (fileDescriptor: FileHandle) => {

  const object = {
      'type': 'FeatureCollection',
      'features': new Array<any>(),
  };

  const features = object['features'];

  const tracksStream = Generators.tracksDescriptor(fileDescriptor);

  for await (const track of tracksStream) {

      features.push(track);

  }

  return object;

};

export const convertFromStream = async (readStream: ReadStream) => {

  return await Streams.parseReadStream(readStream);

};

const SBP2GEO = Object.freeze({
  convertFromDescriptor,
  convertFromStream,
});

export default SBP2GEO;