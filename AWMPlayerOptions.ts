interface AWMValue {
    clock: number;
    video: number;
    score?: number;
}

export interface AWMPlayerOptions {
    /**
     * Should point to a DOM element into which the player will be inserted
     */
    target: Element;

    /**
     * Should contain an url to server’s HTTP output, where the player files and stream info should be requested from.
     *
     * @default false
     */
    host?: string | false;

    /**
     * Should contain a private stream access token.
     *
     * @default false
     */
    accessToken?: string | false;

    /**
     * Whether playback should start automatically. If the browser refuses autoplay, the player will attempt to autoplay
     * with its sound muted.
     *
     * @default true
     */
    autoplay?: boolean;

    /**
     * Whether to show controls in the player. If the value "stock" is used, it will not use the AWM players skinned
     * controls, but use the underlying player’s default controls. Note that this means the awm- player’s appearance
     * will vary with the player that has been selected.
     *
     * @default true
     */
    controls?: boolean | "stock";

    /**
     * Whether to loop the video. This option is not applicable to live streams.
     *
     * @default false
     */
    loop?: boolean;

    /**
     * Whether to start the video with its sound muted.
     *
     * @default false
     */
    muted?: boolean;

    /**
     * Url to an image to display while loading the video. If false, no image is shown.
     *
     * @default false
     */
    poster?: string | false;

    /**
     * Whether the player should grow to fill the container when the stream resolution is smaller than the target
     * element.
     *
     * @default false
     */
    fillSpace?: boolean;

    /**
     * It’s also possible to use a custom skin. This is explained in detail in chapter Skinning.
     *
     * @default "default"
     */
    skin?: object | string;

    /**
     * When an error window is shown, this value will be used as the default delay in seconds after which the default
     * generateAction is executed.
     * Note that there may be certain errors which have a different delay time, and that these delays are disabled on
     * the developers’ skin.
     *
     * @default 10
     */
    reloadDelay?: number;

    /**
     * Appends the specified string to any connections the player opens. This can, for example, be used to pass a user
     * id and passphrase for an access control system.
     *
     * @example "?userid=1337&hash=abc123"
     * @default ?
     */
    urlappend?: string;

    /**
     * If not false, a specific track combination is selected. Use the track type as the key, and the desired track id
     * as its value. A value of -1 can be used to disable the track type entirely. Leave out the track type to select it
     * automatically.
     * Note that some players may not support track switching.
     *
     * @default false
     */
    setTrack?: { video: number; audio: number } | false;

    /**
     * If not false, forces the awm-player to select a source with this mimetype.
     * For your convenience, these are some of the mimetypes:
     * * WebRTC: "webrtc"
     * * WebM: "html5/video/webm"
     * * MP4: "html5/video/mp4"
     * * HLS: "html5/application/vnd.apple.mpegurl"
     * * Dash: "dash/video/mp4"
     * * TS: "html5/video/mpeg"
     * * WAV: "html5/audio/wav"
     * * Progressive: "flash/7"
     * * RTMP: "flash/10"
     * * HDS: "flash/11"
     * * RTSP: "rtsp"
     * * Silverlight: "silverlight"
     *
     * @default false
     */
    forceType?:
        | false
        | "webrtc"
        | "html5/video/webm"
        | "html5/video/mp4"
        | "html5/application/vnd.apple.mpegurl"
        | "dash/video/mp4"
        | "html5/video/mpeg"
        | "html5/audio/wav"
        | "flash/7"
        | "flash/10"
        | "flash/11"
        | "rtsp"
        | "silverlight";

    /**
     * If not false, forces the awm-player to select the player specified. These players are available:
     * * HTML5 player: "html5"
     * * VideoJS player: "videojs"
     * * Dash.js player: "dashjs"
     * * WebRTC player: "webrtc"
     * * Strobe Flash media playback: "flash_strobe
     *
     * @default false
     */
    forcePlayer?: false | "html5" | "videojs" | "dashjs" | "webrtc" | "flash_strobe";

    /**
     * This option can be used to override the order in which sources and/or players are selected by the awm-player.
     * Use the key source to override the sorting of the sources, the key player to override the sorting of the players.
     * By default, the awm-player loops through the sources first, and then through the players. To override this,
     * include the key first with a value of "player".
     *
     * **Sorting rules**
     * The value that can be given to source and player should be an array containing sorting rules. If sorting ties on
     * the first rule, the second rule will be used, and so on. The default rule is always appended to the list, so it
     * does not need to be included.
     * Sorting rules can take several forms:
     * * A string, which is the key that should be sorted by.
     * * An array with two values: the first the key to sort by, and the second..
     *   * -1 to indicate a reverse sort of this value
     *   * an array of values. The array indicates which values should come first, and their order. Any values not in
     *     the array will be treated as equal to eachother.
     * * A function that will be called for every item to be sorted. It will receive the item as its only argument, and
     *   items will be sorted using JavaScript’s sort() function on the return values.
     *
     * **Example**
     * ```
     * forcePriority: {
     *   source: [
     *     [ "type", [ "html5/application/vnd.apple.mpegurl", "webrtc" ] ]
     *   ]
     * }
     * ```
     *
     * Passing this value will reorder the sources according to these rules: first try HLS sources, then WebRTC ones.
     *
     * **Example**
     * ```
     * forcePriority: {
     *   source: [
     *     [ "type", [ "html5/video/webm", "webrtc" ]],
     *     [ "simul_tracks": -1 ],
     *     function(a) { return a.priority * -1; },
     *     "url"
     *   ]
     * }
     * ```
     *
     * Passing this value will reorder the sources according to these rules: first try WebM sources, then WebRTC ones,
     * then reverse sort by the sources’ value of **simul_tracks**, then reverse sort by the sources’ value of
     * **priority**, then sort alphabetically by the sources’ value of **url**.
     *
     * @default false
     */
    forcePriority?:
        | false
        | {
              source: (string | ((a: any) => number) | (string | string[])[])[];
          };

    /**
     * The monitor is part of the awm-player that monitors a stream as it is playing in the browser. It has functions to
     * determine a score, that indicates how well the stream is playing. Should this score fall below a defined
     * threshold, it will take a defined generateAction.
     * The way the monitor functions can be overridden, in part or in full, by using this option. The default monitor
     * object will be extended with the object passed through this option.
     * Listed below are the keys of the monitoring object, and their function. A monitoring function should contain, at
     * the very least, these functions:
     *
     * `init()`
     * The function that starts the monitor and defines the basic shape of the procedure it follows. This is called when
     * the stream should begin playback.
     *
     * `destroy()`
     * Stops the monitor. This is called when the stream has ended or has been paused by the viewer.
     *
     * `reset()`
     * Clears the monitor’s history. This is called when the history becomes invalid because of a seek or change in the
     * playback rate.
     *
     * To tweak the behaviour of the monitor, rather than override it in full, other keys can be used. For example, to
     * automatically switch to the next source / player combination when playback is subpar, pass the below as an
     * option.
     *
     * ***Example**
     * ```
     * monitor: {
     *   generateAction: function() {
     *     this.AwmVideo.log("Switching to nextCombo because of poor playback in" + this.AwmVideo.source.type +
     *       " (" + this.AwmVideo.nextCombo();
     *   }
     * }
     * ```
     *
     * The default monitor is as follows:
     * ```
     * monitor = {
     *   AwmVideo: AwmVideo, // Added here so that the other functions can use it. Do not override it
     *   delay: 1, // The amount of seconds between measurements
     *   averagingSteps: 20, // The amount of measurements that are saved
     *   threshold: function() { // Returns the score threshold below which the "generateAction" should be taken
     *     if (this.AwmVideo.source.type === "webrtc") {
     *       return 0.97;
     *     }
     *     return 0.75;
     *   },
     *   init: function() { // Starts the monitor and defines the basic shape of the procedure it, follows.
     *                      // This is called when the stream should begin playback.
     *     if ((this.vars) && (this.vars.active)) { return; } // It's already running, don't bother
     *     this.AwmVideo.log("Enabling monitor");
     *     this.vars = {
     *       values: [],
     *       score: false,
     *       active: true
     *     };
     *     var monitor = this;
     *
     *     // The procedure to follow
     *     function repeat() {
     *       if ((monitor.vars) && (monitor.vars.active)) {
     *         monitor.vars.timer = this.AwmVideo.timers.start(function() {
     *           var score = monitor.calcScore();
     *           if (score !== false) {
     *             if (monitor.generateCheck(score)) {
     *               monitor.generateAction();
     *             }
     *           }
     *
     *           repeat();
     *         }, monitor.delay * 1e3);
     *       }
     *     }
     *
     *     repeat();
     *   },
     *   destroy: function() { // Stops the monitor. This is called when the stream has ended or has been paused.
     *     if ((!this.vars) || (!this.vars.active)) { return; } // It's not running, don't bother
     *     this.AwmVideo.log("Disabling monitor");
     *     this.AwmVideo.timers.stop(this.vars.timer);
     *     delete this.vars;
     *   },
     *   reset: function() { // Clears the monitor's history. This is called when the history becomes invalid because of
     *                       // a seek or change in the playback rate.
     *     if ((!this.vars) || (!this.vars.active)) {
     *       // It's not running, start it up
     *       this.init();
     *       return;
     *     }
     *     this.AwmVideo.log("Resetting monitor");
     *     this.vars.values = [];
     *   },
     *   calcScore: function() { // Calculate and save the current score
     *     var list = this.vars.values;
     *     list.push(this.getValue()); // Add the current value to the history
     *
     *     if (list.length <= 1) { return false; } // No history yet, can't calculate a score
     *
     *     var score = this.valueToScore(list[0], list[list.length-1]); // Should be 1, decreases if bad
     *
     *     // Kick the oldest value from the array
     *     if (list.length > this.averagingSteps) { list.shift(); }
     *
     *     // The final score is the maximum of the averaged and the current value
     *     score = Math.max(score, list[list.length-1].score);
     *     this.vars.score = score;
     *
     *     return score;
     *   },
     *   valueToScore: function(a, b) { // Calculate the moving average
     *     // If this returns > 1, the video played faster than the clock
     *     // If this returns < 0, the video time went backwards
     *     var rate = 1;
     *
     *     if (("player" in this.AwmVideo) &&
     *         ("api" in this.AwmVideo.player) &&
     *         ("playbackRate" in this.AwmVideo.player.api)) {
     *       rate = this.AwmVideo.player.api.playbackRate;
     *     }
     *
     *     return (b.video - a.video) / (b.clock - a.clock) / rate;
     *   },
     *   getValue: function() { // Save the current testing value and time
     *     // If the video plays, this should keep a constant value. If the video is stalled, it will go up, with
     *     // 1sec/sec. If the video is playing faster, it will go down.
     *     // Current clock time - current playback time
     *     var result = {
     *       clock: (new Date()).getTime() * 1e-3,
     *       video: this.AwmVideo.player.api.currentTime,
     *     };
     *
     *     if (this.vars.values.length) {
     *       result.score = this.valueToScore(this.vars.values[this.vars.values.length-1], result);
     *     }
     *
     *     return result;
     *   },
     *   generateCheck: function(score) { // Determine if the current score is good enough.
     *                            // It must return true if the score fails.
     *     if (this.vars.values.length < this.averagingSteps * 0.5) { return false; } // Gather enough values, first
     *
     *     if (score < this.threshold()) {
     *       return true;
     *     }
     *   },
     *   generateAction: function() { // What to do when the generateCheck is failed
     *     var score = this.vars.score;
     *     // Passive: only if nothing is already showing
     *     this.AwmVideo.showError("Poor playback: " + Math.max(0, Math.round(score * 100)) + "%",
     *     {
     *       passive: true,
     *       reload: true,
     *       nextCombo: true,
     *       ignore: true,
     *       type: "poor_playback"
     *     });
     *   }
     * }
     * ```
     *
     * @default false
     */
    monitor?:
        | false
        | {
              delay?: number;
              averagingSteps?: number;
              threshold?: () => number;
              init?: () => void;
              destroy?: () => void;
              reset?: () => void;
              calcScore?: () => number;
              valueToScore?: (a: AWMValue, b: AWMValue) => number;
              getValue?: () => AWMValue;
              check?: (score: number) => boolean;
              action?: () => void;
          };

    /**
     * When the awm-player has initialized, and whenever it has thrown an error, the function provided will be called.
     * It will receive the AwmVideo object as its only argument.
     * This allows other scripts to control the awm-player.
     *
     * @default false
     */
    callback?: (awmVideo: object) => void;

    /**
     * Pass an object with this option to save a reference to the **AwmVideo** object, which can then be used by other
     * scripts to control the awm-player.
     * It can be important to always have an up to date reference to the **AwmVideo** object. To achieve this, the
     * **AwmVideo** object is saved in the object passed in this option under the key reference, creating the JavaScript
     * equivalent of a pointer.
     *
     * **Example**
     * ```
     * var mv = {};
     * awmPlay("stream", {
     *   target: document.getElementById("stream"),
     *   AwmVideoObject: mv
     * });
     *
     * function killAwmVideo() {
     *   if ("reference" in mv) {
     *     mv.reference.unload();
     *   }
     * }
     * ```
     *
     * The variable **mv.reference** will always point to the **AwmVideo** object that is currently active, so that
     * calling **killAwmVideo()** will unload the awm-player, regardless of where it is in its lifetime.
     *
     * @default false
     */
    AwmVideoObject?: false | { [key: string]: any };
}
