if (!AdjustableMonitor) {
  var AdjustableMonitor = {
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
    SCORE_UPDATE_EVENT: 'score_updated',

    qualitySwitchUpTimeout: 0.0,
    qualitySwitchPreviousMode: null,
    qualitySwitchTimestamp: null,
    currentBitrateIndex: null,
    SWITCH_MODE: {
      UP: 'UP',
      DOWN: 'DOWN',
      INIT: 'INIT'
    },
    trackIdListener: null,

    init: function () {
      this.addTrackIdListener();

      if (this.vars.active) {
        return;
      } //it's already running, don't bother

      this.AwmVideo.log("Enabling monitor");

      this.vars.active = true;

      AwmUtil.event.send(this.PROTOCOL_CHANGE_EVENT, this.AwmVideo.source.type, this.AwmVideo.options.target)

      this.repeat();
    },

    addTrackIdListener: function () {
      if (this.trackIdListener === null) {
        this.trackIdListener = this.AwmVideo.options.target.addEventListener('playerUpdate_trackChanged', function (event) {
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

      if (this.currentBitrateIndex === -1) {
        return false;
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

      return false
    },

    action: function () {
      if (!this.hasOwnProperty('tracklist')) {
        let tracks = AwmUtil.tracks.parse(this.AwmVideo.info.meta.tracks);
        let videoTracks = [];
        if (tracks && tracks.video) {
          videoTracks = Object.values(tracks.video);
          this.AwmVideo.log(`Monitor: Action track selection for '${this.AwmVideo.source.type}'`);
          if (this.AwmVideo.source.type === 'webrtc') {
            this.AwmVideo.log(`Monitor: Action track selection video track id ${this.AwmVideo.options.target.videoTrackId}`);
            if (this.AwmVideo.options.target.videoTrackId !== undefined) {
              let videoTrackIndex = videoTracks.findIndex(item => {
                const trackid = "idx" in item ? item.idx : item.trackid;
                return trackid === this.AwmVideo.options.target.videoTrackId;
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

        if (this.AwmVideo.options.target.videoTrackId !== undefined) {
          let videoTrackIndex = videoTracks.findIndex(item => {
            const trackid = "idx" in item ? item.idx : item.trackid;
            return trackid === this.AwmVideo.options.target.videoTrackId;
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

      this.AwmVideo.player.api.setTracks({video: ("idx" in trackmeta ? trackmeta.idx : trackmeta.trackid)});

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