# SBP to GeoJSON

## Project usage

    npm install sbp2geo

### Code

    const parseReadStream = require('sbp2geo');
    const GeoJSON = await parseReadStream(stream);

## Terminal

    npm install -g sbp2geo

Usage: sbp2geo file.sbp > geo.json
