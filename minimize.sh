#!/bin/bash

CHANGES="$(git diff --name-only --cached | grep embed/)";
readarray -t CHANGES <<<"$CHANGES";

elementIn () {
  local e match="$1";
  shift;
  for e; do [[ "$e" == "$match" ]] && return 0; done;
  return 1;
}

echo "Minimizing player code..";

echo "  Minimizing JS..";

mkdir -p "./min"
mkdir -p "./min/wrappers"
mkdir -p "./min/skins"

# if elementIn "embed/util.js" "${CHANGES[@]}" || elementIn "embed/skins.js" "${CHANGES[@]}" || elementIn "embed/controls.js" "${CHANGES[@]}" || elementIn "embed/player.js" "${CHANGES[@]}" ; then
  echo "    Minimizing 'util.js skins.js controls.js player.js' into 'min/player.js'..";
  terser -mc -o min/player.js -- util.js skins.js controls.js player.js
#fi
echo "  Done.";

echo "    Minimizing wrappers.."

#if elementIn "embed/wrappers/dashjs.js" "${CHANGES[@]}"; then
  echo "      Minimizing dashjs";
  terser -mn -o min/wrappers/dashjs.js -- wrappers/dashjs.js

#fi
#if elementIn "embed/wrappers/html5.js" "${CHANGES[@]}"; then
  echo "      Minimizing html5";
  terser -mn -o min/wrappers/html5.js -- wrappers/html5.js
#fi
#if elementIn "embed/wrappers/videojs.js" "${CHANGES[@]}"; then
  echo "      Minimizing videojs";
  terser -mn -o min/wrappers/videojs.js -- wrappers/videojs.js
#fi
#if elementIn "embed/wrappers/webrtc.js" "${CHANGES[@]}"; then
  echo "      Minimizing webrtc";
  terser -mn -o min/wrappers/webrtc.js -- wrappers/webrtc.js
#fi
  echo "      Minimizing mews";
  terser -mn -o min/wrappers/mews.js -- wrappers/mews.js
echo "    Done.";

cat ./min/wrappers/html5.js >> min/player.js;
cat ./min/wrappers/videojs.js >> min/player.js;
cat ./min/wrappers/dashjs.js >> min/player.js;
cat ./min/wrappers/webrtc.js >> min/player.js;
cat ./min/wrappers/mews.js >> min/player.js;

rm -r ./min/wrappers

echo "  Minimizing CSS..";

#if elementIn "embed/skins/default.css" "${CHANGES[@]}" || elementIn "embed/skins/general.css" "${CHANGES[@]}"; #then
  echo "    Minimizing default";
  cleancss --format keep-breaks -o min/skins/default.css skins/general.css skins/default.css
#fi
#if elementIn "embed/skins/default.css" "${CHANGES[@]}" || elementIn "embed/skins/general.css" "${CHANGES[@]}" || elementIn "embed/skins/dev.css" "${CHANGES[@]}"; then
  echo "    Minimizing dev";
  cleancss --format keep-breaks -o min/skins/dev.css skins/general.css skins/default.css skins/dev.css
#fi
echo "  Done.";
echo "Done.";
