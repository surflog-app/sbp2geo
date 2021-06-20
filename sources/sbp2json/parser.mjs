import Integers from './integers.mjs';

export const chunkName = (chunk) => {

    const date = chunkDate(chunk);

    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const hour = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const seconds = date.getUTCSeconds();

    return [year, month, day, hour, minutes, seconds].join("");

};

export const chunkDate = (chunk) => {

    // January 1st, 2000 - 00:00:00.000 UTC 0
    const TIME_REFERENCE = "2000-01-01T00:00:00.000Z";

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

export const chunkTime = (chunk) => {

    const date = chunkDate(chunk);

    return date.toISOString();

};

export const chunkCoordinates = (chunk) => {

    const latitude = Integers.I32LE(chunk, 12);
    const longitude = Integers.I32LE(chunk, 16);
    const altitude = Integers.I32LE(chunk, 20);

    return Object.freeze([
        longitude / 10000000,
        latitude  / 10000000,
        altitude  / 100,
    ]);

};

export const isTrackStart = (chunk) => {

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

export default Parser;