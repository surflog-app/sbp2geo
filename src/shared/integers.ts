// 8-bit integer, little-endian
export const I8LE = (buffer: Buffer, offset: number) => {

  const rawNumber = buffer[offset] | 0;

  return (rawNumber << 24 >> 24);

};

// 8-bit unsigned, little-endian
export const U8LE = (buffer: Buffer, offset: number) => {

  const rawNumber = buffer[offset] | 0;

  return rawNumber;

};

// 16-bit integer, little-endian
export const I16LE = (buffer: Buffer, offset: number) => {

  const rawA = buffer[offset + 0 | 0] << 0;
  const rawB = buffer[offset + 1 | 0] << 8;

  const rawNumber = rawA | rawB;

  return (rawNumber << 16 >> 16);

};

// 16-bit integer, little-endian
export const U16LE = (buffer: Buffer, offset: number) => {

  const rawA = buffer[offset + 0 | 0] << 0;
  const rawB = buffer[offset + 1 | 0] << 8;

  const rawNumber = rawA | rawB;

  return rawNumber;

};

// 32-bit integer, little-endian
export const I32LE = (buffer: Buffer, offset: number) => {

  const rawA = buffer[offset + 0 | 0] <<  0;
  const rawB = buffer[offset + 1 | 0] <<  8;
  const rawC = buffer[offset + 2 | 0] << 16;
  const rawD = buffer[offset + 3 | 0] << 24;

  const rawNumber = rawA | rawB | rawC | rawD;

  return rawNumber;

};

// 32-bit unsigned, little-endian
export const U32LE = (buffer: Buffer, offset: number) => {

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

export default Integers;