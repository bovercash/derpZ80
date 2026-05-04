# DerpZ80 Fantasy Computer
DerpZ80 is a browser-based, Z80-powered fantasy computer designed for creative assembly coding and retrocomputing experimentation. It provides a self-contained virtual environment with its own ROM, video memory map, and I/O ports, allowing you to write and execute Z80 assembly directly in your browser.

## System Specifications
The DerpZ80 architecture is a custom "fantasy" specification defined by intentional constraints:

CPU: Zilog Z80 (Emulated).

Clock Speed: ~50,000 instructions per execution burst.

Memory Map:

$0000 - $3FFF: System ROM (16KB) - Handles boot, character output, and keyboard input.

$4000 - $42FF: VRAM (768 bytes) - 32x24 character grid.

$4300 - $7EFF: User RAM.

$7F00 - $7F01: System Variables (Cursor X/Y storage).

$8000 - $FFFF: User Land (Standard entry point for assembled code).

Display:

32x24 fixed-width text grid.

"Terminal Green" monochrome output.

I/O Ports:

Port $01: Keyboard Input (Returns ASCII value of pressed key).

## Development & Tooling
DerpZ80 includes an integrated development environment featuring:

On-the-fly Assembly: Uses the Pasmo Z80 cross-assembler to compile code in-browser.

## Licensing
This project is licensed under the GNU General Public License v3 (GPL v3).

DerpZ80 is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

## Credits & Dependencies
DerpZ80 is built upon the hard work of the retrocomputing and open-source communities. This project utilizes the following dependencies:

Z80.js: A Z80 CPU emulator library.  
License: MIT License.
Source: DrGoldfire/Z80.js.

Pasmo: A multiplatform Z80 cross-assembler.
License: GPL License.
Author: Julián Albo.
WASM Port Source: Based on the work by jounikor/pasmo.

## Modifications of Dependent Works

The Pasmo Javascript library has been modified from its original generated WASM source to include logging redirects.  The contents of this change are in the `pasmo.patch` file in the project.

## Local Builds

### GitHub Build

The easiest way to build locally is with the `act` GitHub Actions builder and Docker.  

```bash
docker rm -r pasmo-container #required after the first build
act -j build-and-deploy --bind
```

To run locally, use Python

```bash
cd dist
python3 -m http.server 8080
```

#### Pasmo WASM Port

The builder folder contains a `Dockerfile` that will pull and build pasmo project using the `emscripten` image.  The `pasmo.js` and `pasmo.wasm` files will be available in the resulting image.

#### Z80.js

The Z80.js file is not available in any CDN but can be found in the GitHub repository https://github.com/DrGoldfire/Z80.js

