function getAwmMetric(AwmVideo, statisticCollectorUrl, streamId) {
  return {
    AwmVideo: AwmVideo,
    statisticCollectorUrl: statisticCollectorUrl,
    websocket: null,

    statistic: {
      streamId: streamId,
      score: {value: 0},
      protocol: {value: null},
    },

    listeners: {scoreListener: null, protocolListener: null},

    sendingPeriod: 1000,
    statisticSendingInterval: null,

    start() {
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

      this.websocket = new WebSocket(this.statisticCollectorUrl);

      this.addListeners()

      this.startStatisticSendingInterval();
    },

    addListeners() {
      this.listeners.scoreListener = AwmUtil.event.addListener(this.AwmVideo.options.target, this.AwmVideo.monitor.SCORE_UPDATE_EVENT, ({message}) => {
        this.statistic.score.value = message;
      });

      this.listeners.protocolListener = AwmUtil.event.addListener(this.AwmVideo.options.target, this.AwmVideo.monitor.PROTOCOL_CHANGE_EVENT, ({message}) => {
        this.statistic.protocol.value = message;
      });
    },

    startStatisticSendingInterval() {
      this.statisticSendingInterval = setInterval(() => {
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

      clearTimeout(this.statisticSendingInterval);

      this.websocket.close();
    },

    setStatisticPeriod(statisticSendingInterval) {
      this.statisticSendingInterval = statisticSendingInterval;
    }
  }
}