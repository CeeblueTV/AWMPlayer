var awmplayers = {}; /*TODO move this*/

function AwmPlayer() {
}

function awmPlay(streamName, options) {
  return new AwmVideo(streamName, options);
}

function AwmVideo(streamName, options) {
  var AwmVideo = this;

  if (!options) {
    options = {};
  }
  if (typeof awmoptions != "undefined") {
    options = AwmUtil.object.extend(AwmUtil.object.extend({}, awmoptions), options);
  }
  options = AwmUtil.object.extend({
    host: null,           // Override awm server host (default is the host that player.js is loaded from)
    autoplay: true,       // Start playing when loaded
    controls: true,       // Show controls (AwmControls when available)
    loop: false,          // Don't loop when the stream has finished
    poster: false,        // Don't show an image before the stream has started
    muted: false,         // Don't start muted
    callback: false,      // Don't call a function when the player has finished building
    streaminfo: false,    // Don't use this streaminfo but collect it from the awmserverhost
    startCombo: false,    // Start looking for a player/source match at the start
    forceType: false,     // Don't force a mimetype
    forcePlayer: false,   // Don't force a player
    forceSource: false,   // Don't force a source
    forcePriority: false, // No custom priority sorting
    monitor: false,       // No custom monitoring
    reloadDelay: false,   // Don't override default reload delay
    urlappend: false,     // Don't add this to urls
    setTracks: false,     // Don't set tracks
    fillSpace: false,     // Don't fill parent container
    width: false,         // No set width
    height: false,        // No set height
    maxwidth: false,      // No max width (apart from targets dimensions)
    maxheight: false,     // No max height (apart from targets dimensions)
    AwmVideoObject: false // No reference object is passed
  }, options);

  if (options.host) {
    options.host = AwmUtil.http.url.sanitizeHost(options.host);
  }

  this.options = options;
  this.stream = streamName;
  this.info = false;
  this.logs = [];
  this.log = function (message, type) {
    if (!type) {
      type = "log";
    }
    var event = AwmUtil.event.send(type, message, options.target);
    var data = {
      type: type
    };
    this.logs.push({
      time: new Date(),
      message: message,
      data: data
    });
    if (this.options.skin == "dev") {
      try {
        var msg = "[" + (type ? type : "log") + "] " + (AwmVideo.destroyed ? "[DESTROYED] " : "") + (this.player && this.player.api ? AwmUtil.format.time(this.player.api.currentTime, {ms: true}) + " " : "") + message;
        if (type && (type != "log")) {
          console.warn(msg);
        } else {
          console.log(msg);
        }
      } catch (e) {
      }
    }
    return event;
  };
  this.log("Initializing..");

  this.timers = {
    list: {}, // Will contain the timeouts (format timeOutIndex: endTime)
    start: function (callback, delay) {
      var i = setTimeout(function () {
        delete AwmVideo.timers.list[i];
        callback();
      }, delay);
      this.list[i] = new Date(new Date().getTime() + delay);
      return i;
    },
    stop: function (which) {
      var list;
      if (which == "all") {
        list = this.list;
      } else {
        list = {};
        list[which] = 1;
      }

      for (var i in list) {
        //AwmVideo.log("Stopping timer "+i);
        clearTimeout(i);
        delete this.list[i];
      }
    }
  }
  this.errorListeners = [];
  this.resumeTime = false;

  this.urlappend = function (url) {
    if (this.options.urlappend) {
      url += this.options.urlappend;
    }
    return url;
  }

  new AwmSkin(this);

  this.checkCombo = function (options, quiet) {
    if (!options) {
      options = {};
    }
    options = AwmUtil.object.extend(AwmUtil.object.extend({}, this.options), options)

    var source = false;

    if (options.startCombo) {
      options.startCombo.started = {
        player: false,
        source: false
      };
    }

    // Retrieve the sources we can loop over
    var sources;
    if (options.forceSource) {
      sources = [AwmVideo.info.source[options.forceSource]];
      AwmVideo.log("Forcing source " + options.forceSource + ": " + sources[0].type + " @ " + sources[0].url);
    } else if (options.forceType) {
      sources = AwmVideo.info.source.filter(function (d) {
        return (d.type === options.forceType);
      });
      AwmVideo.log("Forcing type " + options.forceType);
    } else {
      sources = AwmVideo.info.source;
    }

    // Retrieve and sort the players we can loop over
    var players;
    // Make sure all players have the shortname param
    for (var i in awmplayers) {
      awmplayers[i].shortname = i;
    }
    if (options.forcePlayer) {
      players = [awmplayers[options.forcePlayer]];
      AwmVideo.log("Forcing player " + options.forcePlayer);
    } else {
      players = AwmUtil.object.values(awmplayers);
    }


    // Create a copy to not mess with the sorting of the original sourced array
    sources = [].concat(sources);

    var sortoptions = {
      first: "source",
      source: [function (a) {
        if ("origIndex" in a) {
          return a.origIndex;
        }

        //use original sorting -> retrieve index in original array
        a.origIndex = AwmVideo.info.source.indexOf(a)
        return a.origIndex;
      }],
      player: [{priority: 1}]
    };
    var map = {
      inner: "player",
      outer: "source"
    };
    if (options.forcePriority) {
      if ("source" in options.forcePriority) {
        if (!(options.forcePriority.source instanceof Array)) {
          throw "forcePriority.source is not an array.";
        }
        sortoptions.source = options.forcePriority.source.concat(sortoptions.source); //prepend
        AwmUtil.array.multiSort(sources, sortoptions.source);
      }
      if ("player" in options.forcePriority) {
        if (!(options.forcePriority.player instanceof Array)) {
          throw "forcePriority.player is not an array.";
        }
        sortoptions.player = options.forcePriority.player.concat(sortoptions.player); //prepend
        AwmUtil.array.multiSort(players, sortoptions.player);
      }
      if ("first" in options.forcePriority) {
        sortoptions.first = options.forcePriority.first; //overwrite
      }


      //define inner and outer loops
      if (sortoptions.first == "player") {
        map.outer = "player";
        map.inner = "source";
      }
    }

    var variables = {
      player: {
        list: players,
        current: false
      },
      source: {
        list: sources,
        current: false
      }
    };

    function checkStartCombo(which) {
      if ((options.startCombo) && (!options.startCombo.started[which])) {
        //if we have a starting point for the loops, skip testing until we are at the correct point
        if ((options.startCombo[which] == variables[which].current) || (options.startCombo[which] == variables[which].list[variables[which].current])) {
          //we're here!
          options.startCombo.started[which] = true;
          return 1; //issue continue statement in inner loop
        }
        return 2; //always issue continue statement
      }
      return 0; //carry on!
    }

    for (var n in variables[map.outer].list) {
      variables[map.outer].current = n;

      //loop over the sources (prioritized by AwmServer)

      if (checkStartCombo(map.outer) >= 2) {
        continue;
      }

      for (var m in variables[map.inner].list) {
        variables[map.inner].current = m;

        if (checkStartCombo(map.inner) >= 1) {
          continue;
        }

        source = variables.source.list[variables.source.current];
        var p_shortname = variables.player.list[variables.player.current].shortname;
        var player = awmplayers[p_shortname];

        if (player.isMimeSupported(source.type)) {
          //this player supports this mime
          if (player.isBrowserSupported(source.type, source, AwmVideo)) {
            //this browser is supported
            return {
              player: p_shortname,
              source: source,
              source_index: variables.source.current
            };
          }
        }
        if (!quiet) {
          AwmVideo.log("Checking " + player.name + " with " + source.type + ".. Nope.");
        }
      }
    }

    return false;
  }

  this.choosePlayer = function () {
    AwmVideo.log("Checking available players..");

    var result = this.checkCombo();
    if (!result) {
      return false;
    }

    var player = awmplayers[result.player];
    var source = result.source;

    AwmVideo.log("Found a working combo: " + player.name + " with " + source.type + " @ " + source.url);
    AwmVideo.playerName = result.player;
    source = AwmUtil.object.extend({}, source);
    source.index = result.source_index;
    source.url = AwmVideo.urlappend(source.url);
    AwmVideo.source = source;

    AwmUtil.event.send("comboChosen", "Player/source combination selected", AwmVideo.options.target);

    return true;
  }

  function hasVideo(d) {
    if (("meta" in d) && ("tracks" in d.meta)) {
      //check if this stream has video
      var tracks = d.meta.tracks;
      for (var i in tracks) {
        if (tracks[i].type == "video") {
          return true;
        }
      }
    }
    return false;
  }

  function onStreamInfo(d) {

    if ((AwmVideo.player) && (AwmVideo.player.api) && (AwmVideo.player.api.unload)) {
      AwmVideo.log("Received new stream info while a player was already loaded: unloading player");
      AwmVideo.player.api.unload();
    }

    AwmVideo.info = d;
    AwmVideo.info.updated = new Date();
    AwmUtil.event.send("haveStreamInfo", d, AwmVideo.options.target);
    AwmVideo.log("Stream info was loaded succesfully.");

    if ("error" in d) {
      var e = d.error;
      if ("on_error" in d) {
        AwmVideo.log(e);
        e = d.on_error;
      }
      AwmVideo.showError(e, {reload: true, hideTitle: true});
      return;
    }

    //pre-show poster or other loading image
    AwmVideo.calcSize = function (size) {
      if (!size) {
        size = {width: false, height: false};
      }

      var fw = size.width || ('width' in options && options.width ? options.width : false); //force this width
      var fh = size.height || ('height' in options && options.height ? options.height : false); //force this height

      if ((!this.info) || !("source" in this.info)) {
        fw = 640;
        fh = 480;
      } else if ((!this.info.hasVideo) || (this.source.type.split("/")[1] == "audio")) {
        if (!fw) {
          fw = 480;
        }
        if (!fh) {
          fh = 42;
        }
      } else {
        //calculate desired width and height
        if (!(fw && fh)) {
          var ratio = AwmVideo.info.width / AwmVideo.info.height;
          if (fw || fh) {
            if (fw) {
              fh = fw / ratio;
            } else {
              fw = fh * ratio;
            }
          } else {

            //neither width or height are being forced. Set them to the minimum of video and target size
            var cw = ('maxwidth' in options && options.maxwidth ? options.maxwidth : window.innerWidth);
            var ch = ('maxheight' in options && options.maxheight ? options.maxheight : window.innerHeight);
            fw = AwmVideo.info.width;
            fh = AwmVideo.info.height;

            function rescale(factor) {
              fw /= factor;
              fh /= factor;
            }

            if (fw < 426) { //rescale if video width is smaller than 240p
              rescale(fw / 426);
            }
            if (fh < 240) { //rescale if video height is smaller than 240p
              rescale(fh / 240);
            }

            if (cw) {
              if (fw > cw) { //rescale if video width is larger than the target
                rescale(fw / cw);
              }
            }
            if (ch) {
              if (fh > ch) { //rescale if video height is (still?) larger than the target
                rescale(fh / ch);
              }
            }
          }
        }
      }
      this.size = {
        width: Math.round(fw),
        height: Math.round(fh)
      };
      return this.size;
    };

    d.hasVideo = hasVideo(d);


    if (d.type == "live") {
      //calculate duration so far
      var maxms = 0;
      for (var i in AwmVideo.info.meta.tracks) {
        maxms = Math.max(maxms, AwmVideo.info.meta.tracks[i].lastms);
      }
      d.lastms = maxms;
    } else {
      //If this is VoD and was already playing, return to the previous time
      //this is triggered when the AwmInput is killed/crashes during playback

      var time = AwmVideo.resumeTime;
      if (time) {
        var f = function () {
          if (AwmVideo.player && AwmVideo.player.api) {
            AwmVideo.player.api.currentTime = time;
          }
          this.removeEventListener("initialized", f);
        };
        AwmUtil.event.addListener(AwmVideo.options.target, "initialized", f);
      }
    }


    if (AwmVideo.choosePlayer()) {

      //build player
      AwmVideo.player = new awmplayers[AwmVideo.playerName].player();

      AwmVideo.player.onreadylist = [];
      AwmVideo.player.onready = function (dothis) {
        this.onreadylist.push(dothis);
      };


      AwmVideo.player.build(AwmVideo, function (video) {
        AwmVideo.log("Building new player");

        AwmVideo.container.removeAttribute("data-loading");
        AwmVideo.video = video;

        if ("api" in AwmVideo.player) {

          // Add monitoring
          AwmVideo.monitor = {
            AwmVideo: AwmVideo,      // Added here so that the other functions can use it. Do not override it.
            delay: 1,                // The amount of seconds between measurements.
            averagingSteps: 20,      // The amount of measurements that are saved.
            SCORE_UPDATE_EVENT: 'score_updated',
            PROTOCOL_CHANGE_EVENT: 'protocol_changed',
            METRICS_WS_URL: "ws://localhost:8080/",
            vars: {
              values: [],
              score: false,
              active: false
            },
            threshold: function () { // Returns the score threshold below which the "action" should be taken
              if (this.AwmVideo.source.type == "webrtc") {
                return 0.95;
              }
              return 0.75;
            },

            init: function () {             //starts the monitor and defines the basic shape of the procedure it follows. This is called when the stream should begin playback.

              if (this.vars.active) {
                return;
              } //it's already running, don't bother
              this.AwmVideo.log("Enabling monitor");


              this.AwmVideo.monitor.vars.active = true;

              this.repeat()

            },
            destroy: function () {          //stops the monitor. This is called when the stream has ended or has been paused by the viewer.

              if (!this.vars.active) {
                return;
              } //it's not running, don't bother]

              this.AwmVideo.log("Disabling monitor");
              this.AwmVideo.timers.stop(this.vars.timer);

              this.vars.timer = null;
              this.vars.values = [];
              this.vars.active = false;
            },
            reset: function () {            //clears the monitor’s history. This is called when the history becomes invalid because of a seek or change in the playback rate.

              if ((!this.vars) || (!this.vars.active)) {
                //it's not running, start it up
                this.init();
                return;
              }

              this.AwmVideo.log("Resetting monitor");
              this.vars.values = [];
            },
            calcScore: function () {        //calculate and save the current score

              var list = this.vars.values;
              list.push(this.getValue()); //add the current value to the history

              if (list.length <= 1) {
                return false;
              } //no history yet, can't calculate a score

              var score = this.valueToScore(list[0], list[list.length - 1]); //should be 1, decreases if bad

              //kick the oldest value from the array
              if (list.length > this.averagingSteps) {
                list.shift();
              }

              //the final score is the maximum of the averaged and the current value
              score = Math.max(score, list[list.length - 1].score);

              this.vars.score = score;

              AwmUtil.event.send(this.SCORE_UPDATE_EVENT, score, this.AwmVideo.options.target);

              return score;
            },
            valueToScore: function (a, b) {
              // Calculate the moving average
              // If this returns > 1, the video played faster than the clock
              // If this returns < 0, the video time went backwards
              var rate = 1;
              if (("player" in this.AwmVideo) && ("api" in this.AwmVideo.player) && ("playbackRate" in this.AwmVideo.player.api)) {
                rate = this.AwmVideo.player.api.playbackRate;
              }
              return (b.video - a.video) / (b.clock - a.clock) / rate;
            },
            getValue: function () {
              // Save the current testing value and time
              // If the video plays, this should keep a constant value.
              // If the video is stalled, it will go up with 1sec/sec.
              // If the video is playing faster, it will go down.
              // current clock time - current playback time
              var result = {
                clock: (new Date()).getTime() * 1e-3,
                video: this.AwmVideo.player.api.currentTime,
              };
              if (this.vars.values.length) {
                result.score = this.valueToScore(this.vars.values[this.vars.values.length - 1], result);
              }

              return result;
            },
            check: function (score) {
              // Determine if the current score is good enough. It must return true if the score fails.

              if (this.vars.values.length < this.averagingSteps * 0.5) {
                return false;
              } //gather enough values first

              if (score < this.threshold()) {
                return true;
              }
            },
            action: function () {
              // What to do when the check is failed
              var score = this.vars.score;

              // passive: only if nothing is already showing
              this.AwmVideo.showError("Poor playback: " + Math.max(0, Math.round(score * 100)) + "%", {
                passive: true,
                reload: true,
                nextCombo: true,
                ignore: true,
                type: "poor_playback"
              });
            },
            repeat: function () {
              if ((this.vars) && (this.vars.active)) {
                this.vars.timer = this.AwmVideo.timers.start(() => {

                  var score = this.calcScore();
                  if (score !== false) {
                    if (this.check(score)) {
                      this.action();
                    }
                  }
                  this.repeat();
                }, this.delay * 1e3);
              }
            },
          };

          var events;
          //overwrite (some?) monitoring functions/values with custom ones if specified
          if ("monitor" in AwmVideo.options) {
            AwmVideo.monitor.default = AwmUtil.object.extend({}, AwmVideo.monitor);

            if (Object.getOwnPropertyNames(AwmVideo.options.monitor).filter(item => typeof AwmVideo.options.monitor[item] === 'function').length === 0) {
              AwmUtil.object.extend(AwmVideo.monitor, AdjustableMonitor);
            }

            if (AwmVideo.options.monitor) {
              AwmUtil.object.extend(AwmVideo.monitor, AwmVideo.options.monitor);
            }
          }

          // Enable
          events = ["loadstart", "play", "playing"];
          for (var i in events) {
            AwmUtil.event.addListener(AwmVideo.video, events[i], function () {
              AwmVideo.monitor.init()
            });
          }

          // Disable
          events = ["loadeddata", "pause", "abort", "emptied", "ended"];
          for (var i in events) {
            AwmUtil.event.addListener(AwmVideo.video, events[i], function () {
              if (AwmVideo.monitor) {
                AwmVideo.monitor.destroy();
              }
            });
          }

          // Reset
          events = ["seeking", "seeked",/*"canplay","playing",*/"ratechange"];
          for (var i in events) {
            AwmUtil.event.addListener(AwmVideo.video, events[i], function () {
              if (AwmVideo.monitor) {
                AwmVideo.monitor.reset();
              }
            });
          }

        }

        // Remove placeholder and add UI structure
        AwmUtil.empty(AwmVideo.options.target);
        new AwmSkin(AwmVideo);
        AwmVideo.container = new AwmUI(AwmVideo);
        AwmVideo.options.target.appendChild(AwmVideo.container);
        AwmVideo.container.setAttribute("data-loading", ""); //will be removed automatically when video loads

        AwmVideo.video.p = AwmVideo.player;

        // Add event logging
        events = [
          "abort", "canplay", "canplaythrough",/*"durationchange"*/ "emptied", "ended", "loadeddata", "loadedmetadata", "loadstart", "pause", "play", "playing", "ratechange", "seeked", "seeking", "stalled", "volumechange", "waiting", "metaUpdate_tracks", "resizing"
          //,"timeupdate"
        ];
        for (var i in events) {
          AwmUtil.event.addListener(AwmVideo.video, events[i], function (e) {
            AwmVideo.log(AwmVideo.player.name + " player event fired: " + e.type);
          });
        }
        AwmUtil.event.addListener(AwmVideo.video, "error", function (e) { //Needed. Commented console.log below
          var msg;
          if (
              ("player" in AwmVideo) && ("api" in AwmVideo.player)
              && ("error" in AwmVideo.player.api) && (AwmVideo.player.api.error)
          ) {
            if ("message" in AwmVideo.player.api.error) {
              msg = AwmVideo.player.api.error.message;
            } else if (("code" in AwmVideo.player.api.error) && (AwmVideo.player.api.error instanceof MediaError)) {
              var human = {
                1: "MEDIA_ERR_ABORTED: The fetching of the associated resource was aborted by the user's request.",
                2: "MEDIA_ERR_NETWORK: Some kind of network error occurred which prevented the media from being successfully fetched, despite having previously been available.",
                3: "MEDIA_ERR_DECODE: Despite having previously been determined to be usable, an error occurred while trying to decode the media resource, resulting in an error.",
                4: "MEDIA_ERR_SRC_NOT_SUPPORTED: The associated resource or media provider object (such as a MediaStream) has been found to be unsuitable."
              };
              if (AwmVideo.player.api.error.code in human) {
                msg = human[AwmVideo.player.api.error.code];
              } else {
                msg = "MediaError code " + AwmVideo.player.api.error.code;
              }
            } else {
              msg = AwmVideo.player.api.error;
              if (typeof msg != "string") {
                msg = JSON.stringify(msg);
              }
            }
          } else {
            msg = "An error was encountered.";
            //console.log("Err:",e);
          }
          if (AwmVideo.state == "Stream is online") {
            AwmVideo.showError(msg);
          } else {
            //it was probaby an error like "PIPELINE_ERROR_READ: FFmpegDemuxer: data source error" because the live stream has ended. Print it in the log, but display the stream state instead.
            AwmVideo.log(msg, "error");
            AwmVideo.showError(AwmVideo.state, {polling: true});
          }

        });

        //add general resize function
        if ("setSize" in AwmVideo.player) {
          AwmVideo.player.videocontainer = AwmVideo.video.parentNode;
          AwmVideo.video.currentTarget = AwmVideo.options.target;
          if (!AwmUtil.class.has(AwmVideo.options.target, "awmvideo-secondaryVideo")) {
            //this is the main AwmVideo
            AwmVideo.player.resizeAll = function () {
              function findVideo(startAt, matchTarget) {
                if (startAt.video.currentTarget == matchTarget) {
                  return startAt.video;
                }
                if (startAt.secondary) {
                  for (var i = 0; i < startAt.secondary.length; i++) {
                    var result = findVideo(startAt.secondary[i].AwmVideo, matchTarget);
                    if (result) {
                      return result;
                    }
                  }
                }
                return false;
              }

              //find the video that is in the main container, and resize that one
              var main = findVideo(AwmVideo, AwmVideo.options.target);
              if (!main) {
                throw "Main video not found";
              }
              main.p.resize();

              //then, resize the secondaries
              if ("secondary" in AwmVideo) {
                function tryResize(mv) {
                  if (mv.AwmVideo) {
                    if ("player" in mv.AwmVideo) {
                      var sec = findVideo(AwmVideo, mv.AwmVideo.options.target);
                      if (!sec) {
                        throw "Secondary video not found";
                      }
                      sec.p.resize();
                    }
                  } else {
                    //player is not loaded yet, try again later
                    AwmVideo.timers.start(function () {
                      tryResize(mv);
                    }, 0.1e3);
                  }
                }

                for (var i in AwmVideo.secondary) {
                  tryResize(AwmVideo.secondary[i]);
                }
              }
            };

          }
          AwmVideo.player.resize = function (options) {
            var container = AwmVideo.video.currentTarget.querySelector(".awmvideo");
            if (!container.hasAttribute("data-fullscreen")) {
              //if ((!document.fullscreenElement) || (document.fullscreenElement.parentElement != AwmVideo.video.currentTarget)) {
              //first, base the size on the video dimensions
              var size = AwmVideo.calcSize(options);
              this.setSize(size);
              container.style.width = size.width + "px";
              container.style.height = size.height + "px";

              if ((AwmVideo.options.fillSpace) && (!options || !options.reiterating)) {
                //if this container is set to fill the available space
                //start by fitting the video to the window size, then iterate until the container is not smaller than the video
                return this.resize({
                  width: window.innerWidth,
                  height: false,
                  reiterating: true
                });
              }

              //check if the container is smaller than the video, if so, set the max size to the current container dimensions and reiterate
              if ((AwmVideo.video.currentTarget.clientHeight) && (AwmVideo.video.currentTarget.clientHeight < size.height)) {
                //console.log("current h:",size.height,"target h:",AwmVideo.video.currentTarget.clientHeight);
                return this.resize({
                  width: false,
                  height: AwmVideo.video.currentTarget.clientHeight,
                  reiterating: true
                });
              }
              if ((AwmVideo.video.currentTarget.clientWidth) && (AwmVideo.video.currentTarget.clientWidth < size.width)) {
                //console.log("current w:",size.width,"target w:",AwmVideo.video.currentTarget.clientWidth);
                return this.resize({
                  width: AwmVideo.video.currentTarget.clientWidth,
                  height: false,
                  reiterating: true
                });
              }
              AwmVideo.log("Player size calculated: " + size.width + " x " + size.height + " px");
              return true;
            } else {

              //this is the video that is in the main container, and resize this one to the screen dimensions
              this.setSize({
                height: window.innerHeight,
                width: window.innerWidth
              });
              return true;
            }
          };

          //if this is the main video
          if (!AwmUtil.class.has(AwmVideo.options.target, "awmvideo-secondaryVideo")) {
            AwmUtil.event.addListener(window, "resize", function () {
              if (AwmVideo.destroyed) {
                return;
              }
              AwmVideo.player.resizeAll();
            }, AwmVideo.video);
            AwmUtil.event.addListener(AwmVideo.options.target, "resize", function () {
              AwmVideo.player.resizeAll();
            }, AwmVideo.video);
            AwmVideo.player.resizeAll();
          }
        }

        if (AwmVideo.player.api) {
          //add general setSource function
          if ("setSource" in AwmVideo.player.api) {
            AwmVideo.sourceParams = {};
            AwmVideo.player.api.setSourceParams = function (url, params) {
              //append these params to the current source, overwrite if they already exist
              AwmUtil.object.extend(AwmVideo.sourceParams, params);

              AwmVideo.player.api.setSource(AwmUtil.http.url.addParam(url, params));
            };

            //add track selection function
            if (!("setTracks" in AwmVideo.player.api)) {
              AwmVideo.player.api.setTracks = function (usetracks) {

                //check tracks exist
                var meta = AwmUtil.tracks.parse(AwmVideo.info.meta.tracks);
                for (var i in usetracks) {
                  if ((i in meta) && ((usetracks[i] in meta[i]) || (usetracks[i] == "none"))) {
                    continue;
                  }
                  AwmVideo.log("Skipping trackselection of " + i + " track " + usetracks[i] + " because it does not exist");
                  delete usetracks[i];
                }
                //if (!AwmUtil.object.keys(usetracks).length) { return; } //don't do this; allow switching back to auto

                //create source url
                var newurl = AwmVideo.source.url;
                var time = AwmVideo.player.api.currentTime;

                //actually switch to the new source url
                this.setSourceParams(newurl, usetracks);

                AwmUtil.event.send("playerUpdate_trackChanged", {
                  type: Object.keys(usetracks)[0],
                  trackid: usetracks[Object.keys(usetracks)[0]]
                }, AwmVideo.video);

                //restore video position
                if (AwmVideo.info.type != "live") {
                  var f = function () {
                    this.currentTime = time;
                    this.removeEventListener("loadedmetadata", f);
                  };
                  AwmUtil.event.addListener(AwmVideo.video, "loadedmetadata", f);
                }

              }

            }


          }
          //add general setTracks function if setTrack exists
          if (!("setTracks" in AwmVideo.player.api) && ("setTrack" in AwmVideo.player.api)) {
            AwmVideo.player.api.setTracks = function (usetracks) {
              for (var i in usetracks) {
                AwmVideo.player.api.setTrack(i, usetracks[i]);
              }
            };
          }

          if (options.setTracks) {
            var setTracks = AwmUtil.object.extend({}, options.setTracks);
            if (("subtitle" in options.setTracks) && ("setSubtitle" in AwmVideo.player.api)) {
              AwmVideo.player.onready(function () {

                //find the source for subtitles
                var subtitleSource = false;
                for (var i in AwmVideo.info.source) {
                  var source = AwmVideo.info.source[i];
                  //this is a subtitle source, and it's the same protocol (HTTP/HTTPS) as the video source
                  if ((source.type == "html5/text/vtt") && (AwmUtil.http.url.split(source.url).protocol == AwmUtil.http.url.split(AwmVideo.source.url).protocol)) {
                    subtitleSource = source.url.replace(/.srt$/, ".vtt");
                    break;
                  }
                }
                if (!subtitleSource) {
                  return;
                }

                //find the track meta information
                var tracks = AwmUtil.tracks.parse(AwmVideo.info.meta.tracks);
                if (!("subtitle" in tracks) || !(setTracks.subtitle in tracks.subtitle)) {
                  return;
                }
                var meta = tracks.subtitle[setTracks.subtitle];

                //add source to the meta
                meta.src = AwmUtil.http.url.addParam(subtitleSource, {track: setTracks.subtitle});

                meta.label = "automatic";
                meta.lang = "unknown";

                AwmVideo.player.api.setSubtitle(meta);
                AwmUtil.event.send("playerUpdate_trackChanged", {
                  type: "subtitle",
                  trackid: setTracks.subtitle
                }, AwmVideo.video);

                delete setTracks.subtitle;
              });
            }

            if ("setTrack" in AwmVideo.player.api) {
              AwmVideo.player.onready(function () {
                for (var i in setTracks) {
                  AwmVideo.player.api.setTrack(i, setTracks[i]);
                  AwmUtil.event.send("playerUpdate_trackChanged", {
                    type: i,
                    trackid: setTracks[i]
                  }, AwmVideo.video);
                }
              });
            } else if ("setTracks" in AwmVideo.player.api) {
              AwmVideo.player.onready(function () {
                AwmVideo.player.api.setTracks(setTracks);
              });
              for (var i in setTracks) {
                AwmUtil.event.send("playerUpdate_trackChanged", {
                  type: i,
                  trackid: setTracks[i]
                }, AwmVideo.video);

                this.videoTrackId = setTracks[i];
              }
            }
          }

        }

        for (var i in AwmVideo.player.onreadylist) {
          AwmVideo.player.onreadylist[i]();
        }

        AwmUtil.event.send("initialized", null, options.target);
        AwmVideo.log("Initialized");

        Metrics.start(AwmVideo, AwmVideo.monitor.METRICS_WS_URL, AwmVideo.stream.split('+')[1]);

        if (AwmVideo.options.callback) {
          options.callback(AwmVideo);
        }

      });
    } else if (AwmVideo.options.startCombo) {
      //try again without a startCombo
      delete AwmVideo.options.startCombo;
      AwmVideo.unload();
      AwmVideo = awmPlay(AwmVideo.stream, AwmVideo.options);
    } else {
      AwmVideo.showError("No compatible player/source combo found.", {reload: true});
      AwmUtil.event.send("initializeFailed", null, options.target);
      AwmVideo.log("Initialization failed");
    }
  }

  AwmVideo.calcSize = function () {
    return {
      width: 640,
      height: 480
    };
  };

  //load placeholder
  AwmUtil.empty(AwmVideo.options.target);
  new AwmSkin(AwmVideo);
  AwmVideo.container = new AwmUI(AwmVideo, AwmVideo.skin.structure.placeholder);
  AwmVideo.options.target.appendChild(AwmVideo.container);
  AwmVideo.container.setAttribute("data-loading", "");

  //listen for changes to the srteam status
  //switch to polling-mode if websockets are not supported

  function openWithGet() {
    var url = AwmVideo.urlappend(options.host + "/json_" + encodeURIComponent(AwmVideo.stream) + ".js");
    AwmVideo.log("Requesting stream info from " + url);
    AwmUtil.http.get(url, function (d) {
      if (AwmVideo.destroyed) {
        return;
      }
      onStreamInfo(JSON.parse(d));
    }, function () {
      var msg = "Connection failed: the media server may be offline";
      AwmVideo.showError(msg, {reload: 30});
      if (!AwmVideo.info) {
        AwmUtil.event.send("initializeFailed", null, options.target);
        AwmVideo.log("Initialization failed");
      }
    });
  }

  if ("WebSocket" in window) {
    function openSocket() {
      AwmVideo.log("Opening stream status stream..");
      var url = AwmVideo.options.host.replace(/^http/i, "ws");
      var socket = new WebSocket(AwmVideo.urlappend(url + "/json_" + encodeURIComponent(AwmVideo.stream) + ".js"));
      AwmVideo.socket = socket;
      socket.die = false;
      socket.destroy = function () {
        this.die = true;
        this.close();
      };
      socket.onopen = function () {
        this.wasConnected = true;
      };
      socket.onclose = function () {
        if (this.die) {
          //it's supposed to go down
          return;
        }
        if (this.wasConnected) {
          AwmVideo.log("Reopening websocket..");
          openSocket();
          return;
        }

        openWithGet();

      };
      var on_ended_show_state = false;
      var on_waiting_show_state = false;
      socket.addEventListener("message", function (e) {
        var data = JSON.parse(e.data);
        if (!data) {
          AwmVideo.showError("Error while parsing stream status stream. Obtained: " + e.data.toString(), {reload: true});
        }


        if ("error" in data) {
          e = data.error;
          if ("on_error" in data) {
            AwmVideo.log(e);
            e = data.on_error;
          }
          AwmVideo.state = data.error;
          var buttons;
          switch (data.error) {
            case "Stream is offline":
              AwmVideo.info = false;
              if (AwmVideo.player && AwmVideo.player.api && AwmVideo.player.api.currentTime) {
                AwmVideo.resumeTime = AwmVideo.player.api.currentTime;
              }
            case "Stream is initializing":
            case "Stream is booting":
            case "Stream is waiting for data":
            case "Stream is shutting down":
            case "Stream status is invalid?!":
              if ((AwmVideo.player) && (AwmVideo.player.api) && (!AwmVideo.player.api.paused)) {
                //something is (still) playing
                AwmVideo.log(data.error, "error");

                //on ended, show state
                if (!on_ended_show_state) {
                  on_ended_show_state = AwmUtil.event.addListener(AwmVideo.video, "ended", function () {
                    AwmVideo.showError(data.error, {polling: true});
                  });
                }
                if (!on_waiting_show_state) {
                  on_ended_show_state = AwmUtil.event.addListener(AwmVideo.video, "waiting", function () {
                    AwmVideo.showError(data.error, {polling: true});
                  });
                }

                return;
              }
              buttons = {polling: true};
              break;
            default:
              buttons = {reload: true};
          }

          AwmVideo.showError(e, buttons);
        } else {
          //new metadata object!
          //console.log("stream status stream said",data);
          AwmVideo.state = "Stream is online";
          AwmVideo.clearError();
          if (on_ended_show_state) {
            AwmUtil.event.removeListener(on_ended_show_state);
          }
          if (on_waiting_show_state) {
            AwmUtil.event.removeListener(on_waiting_show_state);
          }

          if (!AwmVideo.info) {
            onStreamInfo(data);
            return;
          }

          //figure out what changed

          //calculate the changes. note: ignores missing keys in the new data
          function difference(a, b) {
            if (a == b) {
              return false;
            }
            if ((typeof a == "object") && (typeof b != "undefined")) {
              var results = {};
              for (var i in a) {

                //ignore certain keys for which we don't care about changes
                if (AwmUtil.array.indexOf(["lastms", "hasVideo"], i) >= 0) {
                  continue;
                }

                var d = difference(a[i], b[i]);
                //console.log(i,a[i],b[i],d);
                if (d) {
                  if (d === true) {
                    results[i] = [a[i], b[i]];
                  } else {
                    results[i] = d;
                  }
                }
              }
              //also show keys in b that are not in a
              for (var i in b) {

                //ignore certain keys for which we don't care about changes
                if (AwmUtil.array.indexOf(["lastms", "hasVideo"], i) >= 0) {
                  continue;
                }

                if (!(i in a)) {
                  results[i] = [a[i], b[i]];
                }
              }

              //add this check: [1,2] == [1,2] -> false
              if (AwmUtil.object.keys(results).length) {
                return results;
              }
              return false;
            }
            return true;
          }

          var diff = difference(data, AwmVideo.info);
          if (diff) {
            //console.log("Difference",diff,data,AwmVideo.info);

            if ("source" in diff) {
              if ("error" in AwmVideo.info) {
                AwmVideo.reload();
              }
              return;
            }

            AwmVideo.info = AwmUtil.object.extend(AwmVideo.info, data);
            AwmVideo.info.updated = new Date();

            var resized = false;

            for (var i in diff) {
              switch (i) {
                case "meta": {
                  for (var j in diff[i]) {
                    switch (j) {
                      case "tracks":
                        //if difference in tracks, recalculate info.hasVideo
                        AwmVideo.info.hasVideo = hasVideo(AwmVideo.info);

                        //signal track selector to refresh
                        AwmUtil.event.send("metaUpdate_tracks", data, AwmVideo.video);

                        break;
                    }
                  }
                  break;
                }
                case "width":
                case "height": {
                  resized = true;
                  break;
                }
              }
            }

            if (resized) {
              //call resize function
              AwmVideo.player.resize();
            }

          } else {
            AwmVideo.log("Metachange: no differences detected");
          }

        }

      });
    }

    openSocket();
  } else {
    openWithGet();
  }

  this.unload = function () {
    if (this.destroyed) {
      return;
    }

    this.log("Unloading..");
    this.destroyed = true;

    this.timers.stop("all");
    for (var i in this.errorListeners) {
      var listener = this.errorListeners[i];
      if (listener.src in AwmUtil.scripts.list) {
        var index = AwmUtil.array.indexOf(AwmUtil.scripts.list[listener.src].subscribers);
        if (index >= 0) {
          AwmUtil.scripts.list[listener.src].subscribers.splice(index, 1);
        }
      }
    }
    if (("monitor" in AwmVideo) && ("destroy" in AwmVideo.monitor)) {
      AwmVideo.monitor.destroy();
    }
    if (this.socket) {
      this.socket.destroy();
    }
    if ((this.player) && (this.player.api)) {
      if ("pause" in this.player.api) {
        this.player.api.pause();
      }
      if ("setSource" in this.player.api) {
        this.player.api.setSource("");
        //this.element.load(); //don't use this.load() to avoid interrupting play/pause
      }
      if ("unload" in this.player.api) {
        try {
          this.player.api.unload();
        } catch (e) {
          AwmVideo.log("Error while unloading player: " + e.message);
        }
      }
    }
    if ((this.UI) && (this.UI.elements)) {
      for (var i in this.UI.elements) {
        var e = this.UI.elements[i];
        if ("attachedListeners" in e) {
          //remove attached event listeners
          for (var i in e.attachedListeners) {
            AwmUtil.event.removeListener(e.attachedListeners[i]);
          }
        }
        if (e.parentNode) {
          e.parentNode.removeChild(e);
        }
      }
    }
    if (this.video) {
      AwmUtil.empty(this.video);
    }
    if ("container" in this) {
      AwmUtil.empty(this.container);
      delete this.container;
    }
    AwmUtil.empty(this.options.target);
    delete this.video;

  };
  this.reload = function () {
    var time = ("player" in this && "api" in this.player ? this.player.api.currentTime : false);

    this.unload();
    AwmVideo = awmPlay(this.stream, this.options);

    if ((time) && (this.info.type != "live")) {
      //after load, try to restore the video position
      var f = function () {
        if (AwmVideo.player && AwmVideo.player.api) {
          AwmVideo.player.api.currentTime = time;
        }
        this.removeEventListener("initialized", f);
      };
      AwmUtil.event.addListener(this.options.target, "initialized", f);
    }

    return AwmVideo;
  };
  this.nextCombo = function () {

    var time = false;
    if (("player" in this) && ("api" in this.player)) {
      time = this.player.api.currentTime;
    }

    var startCombo = {
      source: this.source.index,
      player: this.playerName
    };
    if (!this.checkCombo({startCombo: startCombo}, true)) {
      //the nextCombo won't yield a result
      if (this.checkCombo({startCombo: false}, true)) {
        //..but resetting the startcombo would
        startCombo = false;
      } else {
        return;
      }
    }

    this.unload();
    var opts = this.options;
    opts.startCombo = startCombo;
    AwmVideo = awmPlay(this.stream, opts);

    if ((time) && (isFinite(time) && (this.info.type != "live"))) {
      //after load, try to restore the video position
      var f = function () {
        if (("player" in AwmVideo) && ("api" in AwmVideo.player)) {
          AwmVideo.player.api.currentTime = time;
        }
        this.removeEventListener("initialized", f);
      };
      AwmUtil.event.addListener(opts.target, "initialized", f);
    }

  };
  this.onPlayerBuilt = function () {
  };

  if (options.AwmVideoObject) {
    options.AwmVideoObject.reference = this;
  }

  return this;
}
