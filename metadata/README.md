# json-meta-sender.js

This tool allows to test JSON metadatas injection into a stream using TCP.

## Install

`npm install`

## Usage

- Setup "JSON lines over raw TCP" inside Protocols in StreamingService and choose a stream name to use.

- Start to push the stream with any protocol.

- Start sending metadatas :

`./metadata/json-meta-sender.js hostname`

- Then start playback opening `examples/playback-metadata.html`.

> The order is important, for now you can't start sending metadatas AFTER opening playback-metadata.html because it doesn't detect new tracks.

- You can then write additional JSON data in the console of **json-meta-sender.js**.
