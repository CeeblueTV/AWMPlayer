function getAwmDefaultMonitor(AwmVideo) {
  return {
    AwmVideo: AwmVideo,      // Added here so that the other functions can use it. Do not override it.
    delay: 1,                // The amount of seconds between measurements.
    averagingSteps: 20,      // The amount of measurements that are saved.
    vars: {
      values: [],
      score: false,
      active: false
    },
    SCORE_UPDATE_EVENT: 'score_updated',
    PROTOCOL_CHANGE_EVENT: 'protocol_changed',

    threshold: function () { // Returns the score threshold below which the "action" should be taken
      if (this.AwmVideo.source.type === 'webrtc') {
        return 0.95;
      }
      return 0.75;
    },

    init: function () {             //starts the monitor and defines the basic shape of the procedure it follows. This is called when the stream should begin playback.

      if (this.vars.active) {
        return;
      } //it's already running, don't bother
      this.AwmVideo.log('Enabling monitor');


      this.AwmVideo.monitor.vars.active = true;

      this.repeat();

    },
    destroy: function () {          //stops the monitor. This is called when the stream has ended or has been paused by the viewer.

      if (!this.vars.active) {
        return;
      } //it's not running, don't bother]

      this.AwmVideo.log('Disabling monitor');
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

      this.AwmVideo.log('Resetting monitor');
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

      if (AwmVideo.reporting) {
        AwmVideo.reporting.stats.set('playbackScore', Math.round(score * 10) / 10);
      }
      return score;
    },
    valueToScore: function (a, b) {
      // Calculate the moving average
      // If this returns > 1, the video played faster than the clock
      // If this returns < 0, the video time went backwards
      var rate = 1;
      if (('player' in this.AwmVideo) && ('api' in this.AwmVideo.player) && ('playbackRate' in this.AwmVideo.player.api)) {
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
      this.AwmVideo.showError('Poor playback: ' + Math.max(0, Math.round(score * 100)) + '%', {
        passive: true,
        reload: true,
        nextCombo: true,
        ignore: true,
        type: 'poor_playback'
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
}

function getAwmAdjustableMonitor() {
  return {
    MONITORING_WIDTH: 8,
    QUALITY_SWITCH_UP_TIMEOUT: 5.0,
    QUALITY_SWITCH_DOWN_TIMEOUT: 5.0,
    QUALITY_SWITCH_CONNECTION_TIMEOUT: 1.0,
    QUALITY_SWITCH_TIMEOUTS: [5, 20, 60, 120, 300, 600],
    MIN_VALID_SCORE: 0.3,
    DEFAULT_PROTOCOL: ['html5/video/mp4'],
    PROTOCOL_SWITCH_TIMEOUTS: {
      'webrtc': 1.0,
      'ws/video/mp4': 2.0,
      'html5/video/mp4': 4.0,
      'html5/application/vnd.apple.mpegurl': 6.0
    },
    PROTOCOL_CHANGE_EVENT: 'protocol_name',

    qualitySwitchUpTimeout: 0.0,
    qualitySwitchPreviousMode: null,
    qualitySwitchTimestamp: null,
    currentBitrateIndex: -1,
    SWITCH_MODE: {
      UP: 'UP',
      DOWN: 'DOWN',
      INIT: 'INIT'
    },
    trackIdListener: null,

    init: function () {
      if (this.vars.active) {
        return;
      } //it's already running, don't bother

      this.addTrackIdListener();

      this.AwmVideo.log('Enabling monitor');

      this.vars.active = true;

      AwmUtil.event.send(this.PROTOCOL_CHANGE_EVENT, this.AwmVideo.source.type, this.AwmVideo.options.target);

      this.repeat();
    },

    addTrackIdListener: function () {
      if (this.trackIdListener === null) {
        this.trackIdListener = this.AwmVideo.options.target.addEventListener('playerUpdate_trackChanged', (event) => {
          let track = event.message;
          if (track.type === 'video') {
            this.videoTrackId = track.trackid;
          }
        });
      }
    },

    check: function (score) {
      // Get last values
      const values = this.vars.values
        .filter(item => item.hasOwnProperty('score') && item.score >= 0.0)
        .filter(item => item.hasOwnProperty('clock'))
        .slice(Math.max(this.vars.values.length - this.MONITORING_WIDTH, 0));

      if (values.length === 0) {
        return;
      }

      const monitoringDuration = values[values.length - 1].clock - values[0].clock;
      const scores = values.map(item => item.score);
      const scoreMin = Math.min(...scores);
      const scoreSum = scores.reduce((accum, val) => accum + val);
      const scoreAvg = scoreSum / scores.length;
      this.AwmVideo.log(`Monitor: Min: ${scoreMin.toFixed(5)} Avg: ${scoreAvg.toFixed(5)} of ${monitoringDuration.toFixed(2)}s`);

      if (!this.hasOwnProperty('currentBitrateIndex')) {
        this.AwmVideo.log('Monitor: INIT');

        if (monitoringDuration >= this.PROTOCOL_SWITCH_TIMEOUTS[this.source.type]) {
          this.AwmVideo.log('Monitor: Initialization too long, switching to next protocol');

          this.switchToNextProtocol();
        }

        this.qualitySwitchUpTimeout = 0.0;

        this.result = this.SWITCH_MODE.INIT;
        return true;
      }

      // On bad score
      if ((scoreAvg <= this.MIN_VALID_SCORE) && (monitoringDuration >= this.PROTOCOL_SWITCH_TIMEOUTS[this.AwmVideo.source.type])) {
        // Tracks has reverse order by bitrate
        // index 0 => highest bitrate
        if (!this.tracklist || this.currentBitrateIndex >= (this.tracklist.length - 1)) {
          this.switchToNextProtocol();
        }
      }

      // Switch UP
      if (monitoringDuration >= this.QUALITY_SWITCH_UP_TIMEOUT) {
        if (scoreMin > 0.8 && scoreAvg >= 1.0) {

          if (this.qualitySwitchPreviousMode === this.SWITCH_MODE.DOWN) {
            let duration = (Date.now() - this.qualitySwitchTimestamp) * 0.001;
            this.AwmVideo.log(`Monitor: UP timeout ${duration.toFixed(3)} of ${this.qualitySwitchUpTimeout.toFixed(3)}`);

            if (duration >= this.qualitySwitchUpTimeout) {
              this.AwmVideo.log('Monitor: => UP');

              this.result = this.SWITCH_MODE.UP;
              return true;
            }
          } else {
            this.AwmVideo.log('Monitor: => UP');

            this.result = this.SWITCH_MODE.UP;
            return true;
          }
        }
      }

      // Switch DOWN
      // Immediately by min score
      if ((this.qualitySwitchPreviousMode === this.SWITCH_MODE.UP) &&
        (monitoringDuration >= this.QUALITY_SWITCH_CONNECTION_TIMEOUT)
        && (monitoringDuration < this.QUALITY_SWITCH_DOWN_TIMEOUT)) {
        if ((scoreMin <= 0.6) || (scoreAvg <= 0.96)) {
          this.AwmVideo.log(`Monitor: => DOWN by min ${scoreMin.toFixed(5)} <= 0.7 or avg ${scoreAvg.toFixed(5)} <= 0.96`);

          this.result = this.SWITCH_MODE.DOWN;
          return true;
        }
      }

      // By average score
      if (monitoringDuration >= this.QUALITY_SWITCH_DOWN_TIMEOUT) {
        if ((scoreAvg <= 0.92) || (scoreMin <= 0.6)) {
          this.AwmVideo.log(`Monitor: => DOWN by avg ${scoreAvg.toFixed(5)} <= 0.96`);

          this.result = this.SWITCH_MODE.DOWN;
          return true;
        }
      }

      return false;
    },

    action: function () {
      if (!this.hasOwnProperty('tracklist')) {
        let tracks = AwmUtil.tracks.parse(this.AwmVideo.info.meta.tracks);
        let videoTracks = [];
        if (tracks && tracks.video) {
          videoTracks = Object.values(tracks.video);
          this.AwmVideo.log(`Monitor: Action track selection for '${this.AwmVideo.source.type}'`);
          if (this.AwmVideo.source.type === 'webrtc') {
            this.AwmVideo.log(`Monitor: Action track selection video track id ${this.videoTrackId}`);
            if (this.videoTrackId !== undefined) {
              let videoTrackIndex = videoTracks.findIndex(item => {
                const trackid = 'idx' in item ? item.idx : item.trackid;
                return trackid === this.videoTrackId;
              });
              if (videoTrackIndex >= 0) {
                let codec = videoTracks[videoTrackIndex].codec;
                videoTracks = videoTracks.filter(item => item.codec === codec);
              }
            } else {
              this.AwmVideo.log(`Monitor: Action track selection impossible because the vide track is not chosen`);
              return;
            }
          } else {
            videoTracks = videoTracks.filter(item => item.codec === 'H264');
          }
          videoTracks = AwmUtil.array.multiSort(videoTracks, [['bps', -1]]);
        }
        this.tracklist = videoTracks;
        this.AwmVideo.log(`Monitor: Track list ${this.tracklist.map(item => '\'' + item.displayName + '\'').join(', ')}`);

        if (this.videoTrackId !== undefined) {
          let videoTrackIndex = videoTracks.findIndex(item => {
            const trackid = 'idx' in item ? item.idx : item.trackid;
            return trackid === this.videoTrackId;
          });
          if (videoTrackIndex >= 0) {
            this.currentBitrateIndex = videoTrackIndex;
          }
        }
      }

      if (!this.hasOwnProperty('result')) {
        this.AwmVideo.log('Monitor: No result saved, this should not happen!');
        return;
      }

      if (this.tracklist.length === 0) {
        this.AwmVideo.log('Monitor: Video tracks are absent!');
        this.currentBitrateIndex = -1;
        return;
      }

      if (this.tracklist.length === 1) {
        this.currentBitrateIndex = 0;
        return;
      }

      // Lowest bitrate by default
      let bitrateIndex = this.tracklist.length - 1;

      if (this.currentBitrateIndex === -1) {
        this.currentBitrateIndex = bitrateIndex;
      }

      if (this.result === this.SWITCH_MODE.UP) {
        bitrateIndex = Math.max(this.currentBitrateIndex - 1, 0);
      } else if (this.result === this.SWITCH_MODE.DOWN) {
        bitrateIndex = Math.min(this.currentBitrateIndex + 1, this.tracklist.length - 1);
      }

      if (bitrateIndex === this.currentBitrateIndex) {
        return;
      }

      if (this.result === this.SWITCH_MODE.DOWN) {
        // If DOWN -> DOWN - clear UP timeout
        if (this.qualitySwitchPreviousMode === this.SWITCH_MODE.DOWN) {
          this.qualitySwitchUpTimeout = this.QUALITY_SWITCH_TIMEOUTS[0];
        }

        // if UP -> DOWN
        // Increase switching up timeout, if we attempting to often
        if (this.qualitySwitchPreviousMode === this.SWITCH_MODE.UP) {
          let duration = (Date.now() - this.qualitySwitchTimestamp) * 0.001;

          // Increase switching up timeout, if we attempting to often
          if (duration <= this.QUALITY_SWITCH_DOWN_TIMEOUT * 2) {
            let index = this.QUALITY_SWITCH_TIMEOUTS.indexOf(this.qualitySwitchUpTimeout) + 1;
            if (index >= this.QUALITY_SWITCH_TIMEOUTS.length) {
              index = 1;
            }
            this.qualitySwitchUpTimeout = this.QUALITY_SWITCH_TIMEOUTS[index];

            this.AwmVideo.log(`Monitor: Quality switch up timeout => ${this.qualitySwitchUpTimeout}`);
          }
        }
      }

      this.currentBitrateIndex = bitrateIndex;
      this.qualitySwitchTimestamp = Date.now();
      this.qualitySwitchPreviousMode = this.result;

      const trackmeta = this.tracklist[this.currentBitrateIndex];
      this.AwmVideo.log(`Monitor: Switching quality ${this.result} [${this.currentBitrateIndex}]  (${trackmeta.displayName})`);

      this.AwmVideo.player.api.setTracks({ video: ('idx' in trackmeta ? trackmeta.idx : trackmeta.trackid) });

      this.reset();

      delete this.result;
    },

    switchToNextProtocol: function () {
      this.destroy();

      this.AwmVideo.options.AwmVideoObject.reference.unload();

      // Get next type or default
      let types = [this.DEFAULT_PROTOCOL];
      for (const source of this.AwmVideo.options.forcePriority.source) {
        if (source.length >= 2 && source[0] === 'type') {
          types = source[1];
          break;
        }
      }

      const getNextOrLast = function (types, type) {
        let index = types.indexOf(type) + 1;
        if (index >= types.length) {
          index = types.length - 1;
        }

        return index;
      };

      let localOptions = AwmUtil.object.extend({}, this.AwmVideo.options);
      localOptions.forceType = types[getNextOrLast(types, this.AwmVideo.source.type)];

      if (localOptions.forceType !== this.AwmVideo.source.type) {

        for (let attempt = 0; attempt < types.length; attempt++) {
          this.AwmVideo.log(`Switching to '${localOptions.forceType}'`);

          const checkCombo = this.AwmVideo.options.AwmVideoObject.reference.checkCombo(localOptions, true);
          if (checkCombo === false) {
            const type = localOptions.forceType;
            localOptions.forceType = types[getNextOrLast(types, type)];

            continue;
          }

          break;
        }

        AwmUtil.event.send(this.PROTOCOL_CHANGE_EVENT, localOptions.forceType, this.AwmVideo.options.target);

        awmPlay(this.AwmVideo.stream, localOptions);
      }
    },
  };
}
