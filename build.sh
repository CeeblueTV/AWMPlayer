#!/bin/bash

DIST_PATH="./dist"

rm -rf $DIST_PATH

mkdir  $DIST_PATH

echo "Building player ...";
PLAYER_PATH="$DIST_PATH/player.js"
cat "./util.js"             >> $PLAYER_PATH
cat "./skins.js"            >> $PLAYER_PATH
cat "./controls.js"         >> $PLAYER_PATH
cat "./monitor.js"          >> $PLAYER_PATH
cat "./player.js"           >> $PLAYER_PATH
cat "./wrappers/html5.js"   >> $PLAYER_PATH
cat "./wrappers/videojs.js" >> $PLAYER_PATH
cat "./wrappers/dashjs.js"  >> $PLAYER_PATH
cat "./wrappers/webrtc.js"  >> $PLAYER_PATH
cat "./wrappers/mews.js"    >> $PLAYER_PATH
echo "Done '$PLAYER_PATH'"


mkdir "$DIST_PATH/skins"

echo "Building 'default' CSS ...";
DEFAULT_CSS_PATH="$DIST_PATH/skins/default.css"
cat "./skins/general.css" >> $DEFAULT_CSS_PATH
cat "./skins/default.css" >> $DEFAULT_CSS_PATH
echo "Done '$DEFAULT_CSS_PATH'"

echo "Building 'dev' CSS ...";
DEV_CSS_PATH="$DIST_PATH/skins/dev.css"
cat "./skins/general.css" >> $DEV_CSS_PATH
cat "./skins/default.css" >> $DEV_CSS_PATH
cat "./skins/dev.css"     >> $DEV_CSS_PATH
echo "Done '$DEV_CSS_PATH'"

# Minimizing
mkdir "$DIST_PATH/min"
echo "Minimizing player ...";
MIN_PLAYER_PATH="$DIST_PATH/min/player.js"
terser -mc -o $MIN_PLAYER_PATH -- $PLAYER_PATH
echo "Done '$MIN_PLAYER_PATH'"

mkdir "$DIST_PATH/min/skins"
echo "Minimizing 'default' CSS ...";
MIN_DEFAULT_CSS_PATH="$DIST_PATH/min/skins/default.css"
cleancss --format keep-breaks -o $MIN_DEFAULT_CSS_PATH $DEFAULT_CSS_PATH
echo "Done '$MIN_DEFAULT_CSS_PATH'"

echo "Minimizing 'dev' CSS ...";
MIN_DEV_CSS_PATH="$DIST_PATH/min/skins/dev.css"
cleancss --format keep-breaks -o $MIN_DEV_CSS_PATH $DEV_CSS_PATH
echo "Done '$MIN_DEV_CSS_PATH'"
