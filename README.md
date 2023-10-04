# AWMPlayer

## Requirements

A recent version of [Node.js](https://nodejs.org/en/download) is needed to build the library.

## How to build

```shell
npm install
npm run build
```

## How to use

We provide some [examples](/examples) to see how to integrate the player in a web page.

To host them locally we suggest to use [http-server](https://www.npmjs.com/package/http-server) :

```shell
http-server . -p 8081 -C <path to cert.pem> -K <path to key.pem> -S
```

Then open [playback-webrtc-middle.html](/examples/playback-webrtc-middle.html), this example use:
 - WebRTC first if possible,
 - `getAwmMiddleMonitor()` to implement ABR switching
 - `forceTrack` to force the first track selection to the selected bitrate (here 250000)
You can add query options to change the `host` and `streamName` like this :

```
https://localhost:8081/examples/playback-webrtc-middle.html?host=fly.live.ceeblue.tv:4433&streamName=out+de1e6f7c-e5db-450b-9603-c3644274779b
```

## Video quality switching


![img.svg](./doc/AWMPlayerQualityAng.svg)