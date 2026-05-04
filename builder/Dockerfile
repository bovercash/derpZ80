FROM emscripten/emsdk:latest AS builder

WORKDIR /

# Clone the repo
RUN git clone https://github.com/jounikor/pasmo.git

# Move into the actual source directory
WORKDIR /pasmo/pasmo

# 1. We specifically exclude 'test_' files to avoid those compilation errors
# 2. We keep the explicit defines from your CMake file
RUN emcc $(ls *.cxx | grep -v "test_") -o pasmo.js \
    -DVERSION=\"0.5.5.paged\" \
    -DNDEBUG \
    -s MODULARIZE=1 \
    -s EXPORT_NAME="PasmoModule" \
    -s EXPORTED_RUNTIME_METHODS='["FS", "callMain"]' \
    -s FORCE_FILESYSTEM=1 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s INVOKE_RUN=0 \
    -O3