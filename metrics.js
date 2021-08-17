if (!Metrics) {
  var Metrics = {
    signallingUrl: '',
    statistic: {
      streamId: null,
      score: {date: Date.now(), value: 0},
      protocol: {date: Date.now(), value: null},
    },
    websocket: null,
    AwmVideo: null,
    statisticSendingInterval: 1000,
    listeners: {scoreListener: null, protocolListener: null},

    start(AwmVideo, signallingUrl, streamId) {
      if (!AwmVideo && !this.AwmVideo) {
        throw "AwmVideo is required";
      }
      if (!streamId) {
        throw "stream id is required";
      }
      if (this.websocket !== null) {
        console.warn('Websocket is already created');
        return;
      }

      this.signallingUrl = signallingUrl ? signallingUrl : this.signallingUrl;

      this.websocket = new WebSocket(this.signallingUrl);

      this.AwmVideo = AwmVideo;

      this.statistic.streamId = streamId;

      this.addListeners()

      this.sendStatistic();
    },

    addListeners() {
      this.listeners.scoreListener = AwmUtil.event.addListener(this.AwmVideo.options.target, this.AwmVideo.monitor.SCORE_UPDATE_EVENT, ({message}) => {
        this.statistic.score.date = Date.now();
        this.statistic.score.value = message;
      });

      this.listeners.protocolListener = AwmUtil.event.addListener(this.AwmVideo.options.target, this.AwmVideo.monitor.PROTOCOL_CHANGE_EVENT, ({message}) => {
        this.statistic.protocol.date = Date.now();
        this.statistic.protocol.value = message;
      });
    },

    sendStatistic() {
      setInterval(() => {
        if (this.websocket.readyState !== WebSocket.OPEN) {
          return;
        }

        this.websocket.send(JSON.stringify(this.statistic));

      }, this.statisticSendingInterval);
    },

    stop() {
      for (let listener in this.listeners) {
        AwmUtil.event.removeListener(listener);
      }

      this.websocket.close();
    },

    setStatisticInterval(statisticSendingInterval) {
      this.statisticSendingInterval = statisticSendingInterval;
    }
  }
}