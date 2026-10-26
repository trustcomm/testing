import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setCodec('h264');
Config.setCrf(16);
Config.setPixelFormat('yuv420p');
Config.setConcurrency(null); // auto
// Uncomment if Remotion can't download its own headless Chrome:
// Config.setBrowserExecutable('/path/to/chrome');
