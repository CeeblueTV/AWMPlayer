awmplayers.dashjs = {
  name: "Dash.js player",
  mimes: ["dash/video/mp4"/*,"html5/application/vnd.ms-ss"*/],
  priority: AwmUtil.object.keys(awmplayers).length + 1,
  isMimeSupported: function (mimetype) {
    return (AwmUtil.array.indexOf(this.mimes, mimetype) == -1 ? false : true);
  },
  isBrowserSupported: function (mimetype, source, AwmVideo) {

    //check for http/https mismatch
    if (location.protocol != AwmUtil.http.url.split(source.url).protocol) {
      AwmVideo.log("HTTP/HTTPS mismatch for this source");
      return false;
    }

    //don't use dashjs if this location is loaded over file://
    if (location.protocol == "file:") {
      AwmVideo.log("This source (" + mimetype + ") won't load if the page is run via file://");
      return false;
    }

    return ("MediaSource" in window);
  },
  player: function () {
    this.onreadylist = [];
  },
  scriptsrc: function (host) {
    return host + "/dashjs.js";
  }
};
var p = awmplayers.dashjs.player;
p.prototype = new AwmPlayer();
p.prototype.build = function (AwmVideo, callback) {
  var me = this;
  me.name = 'dashjs';

  this.onDashLoad = function () {
    if (AwmVideo.destroyed) {
      return;
    }

    AwmVideo.log("Building DashJS player..");

    var ele = document.createElement("video");

    if ("Proxy" in window) {
      var overrides = {
        get: {},
        set: {}
      };

      AwmVideo.player.api = new Proxy(ele, {
        get: function (target, key) {
          if (key in overrides.get) {
            return overrides.get[key].apply(target, arguments);
          }
          var method = target[key];
          if (typeof method === "function") {
            return function () {
              return method.apply(target, arguments);
            }
          }
          return method;
        },
        set: function (target, key, value) {
          if (key in overrides.set) {
            return overrides.set[key].call(target, value);
          }
          return target[key] = value;
        }
      });

      if (AwmVideo.info.type == "live") {
        overrides.get.duration = function () {
          //this should indicate the end of Awm's buffer
          var buffer_end = 0;
          if (this.buffered.length) {
            buffer_end = this.buffered.end(this.buffered.length - 1)
          }
          var time_since_buffer = (new Date().getTime() - AwmVideo.player.api.lastProgress.getTime()) * 1e-3;
          return buffer_end + time_since_buffer + -1 * AwmVideo.player.api.liveOffset + 45;
        };
        overrides.set.currentTime = function (value) {
          var offset = value - AwmVideo.player.api.duration;
          //AwmVideo.player.api.liveOffset = offset;

          AwmVideo.log("Seeking to " + AwmUtil.format.time(value) + " (" + Math.round(offset * -10) / 10 + "s from live)");

          AwmVideo.video.currentTime = value;
          //.player.api.setSource(AwmUtil.http.url.addParam(AwmVideo.source.url,{startunix:offset}));
        }
        AwmUtil.event.addListener(ele, "progress", function () {
          AwmVideo.player.api.lastProgress = new Date();
        });
        AwmVideo.player.api.lastProgress = new Date();
        AwmVideo.player.api.liveOffset = 0;
      }

    } else {
      me.api = ele;
    }

    if (AwmVideo.options.autoplay) {
      ele.setAttribute("autoplay", "");
    }
    if ((AwmVideo.options.loop) && (AwmVideo.info.type != "live")) {
      ele.setAttribute("loop", "");
    }
    if (AwmVideo.options.poster) {
      ele.setAttribute("poster", AwmVideo.options.poster);
    }
    if (AwmVideo.options.muted) {
      ele.muted = true;
    }
    if (AwmVideo.options.controls == "stock") {
      ele.setAttribute("controls", "");
    }

    var player = dashjs.MediaPlayer().create();
    //player.getDebug().setLogToBrowserConsole(false);
    player.initialize(ele, AwmVideo.source.url, AwmVideo.options.autoplay);


    me.dash = player;

    //add listeners for events that we can log
    var skipEvents = ["METRIC_ADDED", "METRIC_UPDATED", "METRIC_CHANGED", "METRICS_CHANGED", "FRAGMENT_LOADING_STARTED", "FRAGMENT_LOADING_COMPLETED", "LOG", "PLAYBACK_TIME_UPDATED", "PLAYBACK_PROGRESS"];
    for (var i in dashjs.MediaPlayer.events) {
      if (skipEvents.indexOf(i) < 0) {
        me.dash.on(dashjs.MediaPlayer.events[i], function (e) {
          AwmVideo.log("Player event fired: " + e.type);
        });
      }
    }

    AwmVideo.player.setSize = function (size) {
      this.api.style.width = size.width + "px";
      this.api.style.height = size.height + "px";
    };
    AwmVideo.player.api.setSource = function (url) {
      AwmVideo.player.dash.attachSource(url);
    };

    var subsloaded = false;
    me.dash.on("allTextTracksAdded", function () {
      subsloaded = true;
    });

    AwmVideo.player.api.setSubtitle = function (trackmeta) {

      if (!subsloaded) {
        var f = function () {
          AwmVideo.player.api.setSubtitle(trackmeta);
          me.dash.off("allTextTracksAdded", f);
        };
        me.dash.on("allTextTracksAdded", f);
        return;
      }
      if (!trackmeta) {
        me.dash.enableText(false);
        return;
      }

      var dashsubs = me.dash.getTracksFor("text");
      for (var i in dashsubs) {
        var trackid = ("idx" in trackmeta ? trackmeta.idx : trackmeta.trackid);
        if (dashsubs[i].id == trackid) {
          me.dash.setTextTrack(i);
          if (!me.dash.isTextEnabled()) {
            me.dash.enableText();
          }
          return true;
        }
      }

      return false; //failed to find subtitle
    };

    //dashjs keeps on spamming the stalled icon >_>
    AwmUtil.event.addListener(ele, "progress", function () {
      if (AwmVideo.container.getAttribute("data-loading") == "stalled") {
        AwmVideo.container.removeAttribute("data-loading");
      }
    });

    me.api.unload = function () {
      me.dash.reset();
    };

    AwmVideo.log("Built html");
    callback(ele);
  }

  if ("dashjs" in window) {
    this.onDashLoad();
  } else {

    var scripttag = AwmUtil.scripts.insert(AwmVideo.urlappend(awmplayers.dashjs.scriptsrc(AwmVideo.options.host)), {
      onerror: function (e) {
        var msg = "Failed to load dashjs.js";
        if (e.message) {
          msg += ": " + e.message;
        }
        AwmVideo.showError(msg);
      },
      onload: me.onDashLoad
    }, AwmVideo);
  }
}
