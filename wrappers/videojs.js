awmplayers.videojs = {
  name: 'VideoJS player',
  mimes: ['html5/application/vnd.apple.mpegurl', 'html5/application/vnd.apple.mpegurl;version=7'],
  priority: AwmUtil.object.keys(awmplayers).length + 1,
  isMimeSupported: function (mimetype) {
    return (this.mimes.indexOf(mimetype) == -1 ? false : true);
  },
  isBrowserSupported: function (mimetype, source, AwmVideo) {

    //check for http/https mismatch
    if (location.protocol != AwmUtil.http.url.split(source.url).protocol) {
      AwmVideo.log('HTTP/HTTPS mismatch for this source');
      return false;
    }

    //don't use videojs if this location is loaded over file://
    if ((location.protocol == 'file:') && (mimetype == 'html5/application/vnd.apple')) {
      AwmVideo.log('This source (' + mimetype + ') won\'t load if the page is run via file://');
      return false;
    }

    return ('MediaSource' in window);
  },
  player: function () {
  },
  scriptsrc: function (host) {
    return host + '/videojs.js';
  }
};
var p = awmplayers.videojs.player;
p.prototype = new AwmPlayer();
p.prototype.build = function (AwmVideo, callback) {
  var me = this; //to allow nested functions to access the player class itself
  me.name = 'videojs';

  var ele;

  function onVideoJSLoad() {
    if (AwmVideo.destroyed) {
      return;
    }

    AwmVideo.log('Building VideoJS player..');

    ele = document.createElement('video');
    if (AwmVideo.source.type != 'html5/video/ogg') {
      ele.crossOrigin = 'anonymous'; //required for subtitles, but if ogg, the video won"t load
    }
    ele.setAttribute('playsinline', ''); //for apple

    var shortmime = AwmVideo.source.type.split('/');
    if (shortmime[0] == 'html5') {
      shortmime.shift();
    }

    var source = document.createElement('source');
    source.setAttribute('src', AwmVideo.source.url);
    me.source = source;
    ele.appendChild(source);
    source.type = shortmime.join('/');
    AwmVideo.log('Adding ' + source.type + ' source @ ' + AwmVideo.source.url);
    //if (source.type.indexOf("application/vnd.apple.mpegurl") >= 0) { source.type = "application/x-mpegURL"; }
    //source.type = "application/vnd.apple.mpegurl";

    AwmUtil.class.add(ele, 'video-js');

    var vjsopts = {};

    if (AwmVideo.options.autoplay) {
      vjsopts.autoplay = true;
    }
    if ((AwmVideo.options.loop) && (AwmVideo.info.type != 'live')) {
      //vjsopts.loop = true;
      ele.setAttribute('loop', '');
    }
    if (AwmVideo.options.muted) {
      //vjsopts.muted = true;
      ele.setAttribute('muted', '');
    }
    if (AwmVideo.options.poster) {
      vjsopts.poster = AwmVideo.options.poster;
    }
    if (AwmVideo.options.controls == 'stock') {
      ele.setAttribute('controls', '');
      if (!document.getElementById('videojs-css')) {
        var style = document.createElement('link');
        style.rel = 'stylesheet';
        style.href = AwmVideo.options.host + '/skins/videojs.css';
        style.id = 'videojs-css';
        document.head.appendChild(style);
      }
    } else {
      vjsopts.controls = false;
    }

    //for android < 7, enable override native
    function androidVersion() {
      var match = navigator.userAgent.toLowerCase().match(/android\s([\d\.]*)/i);
      return match ? match[1] : false;
    }

    var android = AwmUtil.getAndroid();
    if (android && (parseFloat(android) < 7)) {
      AwmVideo.log('Detected android < 7: instructing videojs to override native playback');
      vjsopts.html5 = { hls: { overrideNative: true } };
      vjsopts.nativeAudioTracks = false;
      vjsopts.nativeVideoTracks = false;
    }

    me.onready(function () {
      AwmVideo.log('Building videojs');
      me.videojs = videojs(ele, vjsopts, function () {
        AwmVideo.log('Videojs initialized');
      });

      AwmUtil.event.addListener(ele, 'error', function (e) {
        if (e.target.error.message.indexOf('NS_ERROR_DOM_MEDIA_OVERFLOW_ERR') >= 0) {
          //there is a problem with a certain segment, try reloading
          AwmVideo.timers.start(function () {
            AwmVideo.log('Reloading player because of NS_ERROR_DOM_MEDIA_OVERFLOW_ERR');
            AwmVideo.reload();
          }, 1e3);
        }
      });

      me.api.unload = function () {
        if (me.videojs) {
          me.videojs.autoplay(false); //don't play again ffs
          me.videojs.pause(); //pause goddamn
          me.videojs.dispose(); //and now die, bitch
          me.videojs = false;
          AwmVideo.log('Videojs instance disposed');
        }
      };

    });

    AwmVideo.log('Built html');

    if (('Proxy' in window) && ('Reflect' in window)) {
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
          if (typeof method === 'function') {
            return function () {
              return method.apply(target, arguments);
            };
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
      AwmVideo.player.api.load = function () {
      };

      overrides.set.currentTime = function (value) {
        AwmVideo.player.videojs.currentTime(value); //seeking backwards does not work if we set it on the video directly
        //AwmVideo.video.currentTime = value;
      };

      if (AwmVideo.info.type == 'live') {
        function getLastBuffer(video) {
          var buffer_end = 0;
          if (video.buffered.length) {
            buffer_end = video.buffered.end(video.buffered.length - 1);
          }
          return buffer_end;
        }

        var HLSlatency = 0; //best guess..

        overrides.get.duration = function () {
          if (AwmVideo.info) {
            var duration = (AwmVideo.info.lastms + (new Date()).getTime() - AwmVideo.info.updated.getTime()) * 1e-3;
            //if (isNaN(duration)) { return 1e9; }
            return duration;
          }
          return 0;
        };
        AwmVideo.player.api.lastProgress = new Date();
        AwmVideo.player.api.liveOffset = 0;

        AwmUtil.event.addListener(ele, 'progress', function () {
          AwmVideo.player.api.lastProgress = new Date();
        });
        overrides.set.currentTime = function (value) {
          var diff = AwmVideo.player.api.currentTime - value;
          var offset = value - AwmVideo.player.api.duration;
          //AwmVideo.player.api.liveOffset = offset;

          AwmVideo.log('Seeking to ' + AwmUtil.format.time(value) + ' (' + Math.round(offset * -10) / 10 + 's from live)');
          //AwmVideo.video.currentTime -= diff;
          AwmVideo.player.videojs.currentTime(AwmVideo.video.currentTime - diff); //seeking backwards does not work if we set it on the video directly
        };
        var lastms = 0;
        overrides.get.currentTime = function () {
          if (AwmVideo.info) {
            lastms = AwmVideo.info.lastms * 1e-3;
          }
          var time = this.currentTime + lastms - AwmVideo.player.api.liveOffset - HLSlatency;
          if (isNaN(time)) {
            return 0;
          }
          return time;
        };
      }
    } else {
      me.api = ele;
    }

    AwmVideo.player.setSize = function (size) {
      if ('videojs' in AwmVideo.player) {
        AwmVideo.player.videojs.dimensions(size.width, size.height);

        //for some reason, the videojs' container won't be resized with the method above.
        //so let's cheat and do it ourselves
        ele.parentNode.style.width = size.width + 'px';
        ele.parentNode.style.height = size.height + 'px';
      }
      this.api.style.width = size.width + 'px';
      this.api.style.height = size.height + 'px';
    };
    AwmVideo.player.api.setSource = function (url) {
      if (!AwmVideo.player.videojs) {
        return;
      }
      if (AwmVideo.player.videojs.src() != url) {
        AwmVideo.player.videojs.src({
          type: AwmVideo.player.videojs.currentSource().type,
          src: url
        });
      }
    };
    AwmVideo.player.api.setSubtitle = function (trackmeta) {
      //remove previous subtitles
      var tracks = ele.getElementsByTagName('track');
      for (var i = tracks.length - 1; i >= 0; i--) {
        ele.removeChild(tracks[i]);
      }
      if (trackmeta) { //if the chosen track exists
        //add the new one
        var track = document.createElement('track');
        ele.appendChild(track);
        track.kind = 'subtitles';
        track.label = trackmeta.label;
        track.srclang = trackmeta.lang;
        track.src = trackmeta.src;
        track.setAttribute('default', '');
      }
    };

    if (AwmVideo.info.type == 'live') {

      //for some reason, videojs doesn't always fire the canplay event ???
      //mitigate by sending one when durationchange follows loadstart

      var loadstart = AwmUtil.event.addListener(ele, 'loadstart', function () {
        AwmUtil.event.removeListener(loadstart);
        AwmUtil.event.send('canplay', false, this);
      });
      var canplay = AwmUtil.event.addListener(ele, 'canplay', function () {
        //remove the listener
        if (loadstart) {
          AwmUtil.event.removeListener(loadstart);
        }
        AwmUtil.event.removeListener(canplay);
      });

    }

    callback(ele);
  }

  if ('videojs' in window) {
    onVideoJSLoad();
  } else {
    //load the videojs player

    var timer = false;

    function reloadVJSrateLimited() {

      try {
        AwmVideo.video.pause();
      } catch (e) {
      }
      AwmVideo.showError('Error in videojs player');

      //rate limit the reload
      if (!window.awmplayer_videojs_failures) {
        window.awmplayer_videojs_failures = 1;
        AwmVideo.reload();
      } else {
        if (!timer) {
          var delay = 0.05 * Math.pow(2, window.awmplayer_videojs_failures);
          AwmVideo.log('Rate limiter activated: AwmPlayer reload delayed by ' + Math.round(delay * 10) / 10 + ' seconds.', 'error');
          timer = AwmVideo.timers.start(function () {
            timer = false;
            delete window.videojs;
            AwmVideo.reload();
          }, delay * 1e3);
          window.awmplayer_videojs_failures++;
        }
      }
    }

    var scripturl = AwmVideo.urlappend(awmplayers.videojs.scriptsrc(AwmVideo.options.host));
    var scripttag;
    var f = function (msg, url) {
      if (!scripttag) {
        return;
      }

      if (url == scripttag.src) {
        //error in internal videojs code
        //console.error(me.videojs,AwmVideo.video,ele,arguments);
        window.removeEventListener('error', f);
        reloadVJSrateLimited();
      }

      return false;
    };
    window.addEventListener('error', f);

    //disabled for now because it seemed to cause more issues than it solved
    /*var old_console_error = console.error;
    console.error = function(){
      if (arguments[0] == "VIDEOJS:") {
        if ((arguments.length > 3) && arguments[4] && (arguments[4].code == 3)) { return; } //it's a decoding  error, nothing in videojs itself
        //videojs reports an error
        console.error = old_console_error;
        reloadVJSrateLimited();
      }
      return old_console_error.apply(this,arguments);
    };*/

    scripttag = AwmUtil.scripts.insert(scripturl, {
      onerror: function (e) {
        var msg = 'Failed to load videojs.js';
        if (e.message) {
          msg += ': ' + e.message;
        }
        AwmVideo.showError(msg);
      },
      onload: onVideoJSLoad
    }, AwmVideo);

  }
};
