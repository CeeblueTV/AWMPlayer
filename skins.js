if (typeof AwmSkins == 'undefined') {
  var AwmSkins = {};
}
var awmhost;
if ((typeof awmoptions != 'undefined') && ('host' in awmoptions)) {
  awmhost = AwmUtil.http.url.sanitizeHost(awmoptions.host);
} else {
  awmhost = '..';
}

AwmSkins['default'] = {
  structure: {
    main: {
      if: function () {
        return (!!this.info.hasVideo && (this.source.type.split('/')[1] != 'audio'));
      },
      then: { //use this substructure when there is video
        type: 'placeholder',
        classes: ['awmvideo'],
        children: [{
          type: 'hoverWindow',
          mode: 'pos',
          style: { position: 'relative' },
          transition: {
            hide: 'left: 0; right: 0; bottom: -43px;',
            show: 'bottom: 0;',
            viewport: 'left:0; right: 0; top: -1000px; bottom: 0;'
          },
          button: { type: 'videocontainer' },
          children: [{ type: 'loading' }, { type: 'error' }],
          window: { type: 'controls' }
        }]
      },
      else: { //use this subsctructure for audio only
        type: 'container',
        classes: ['awmvideo'],
        style: { overflow: 'visible' },
        children: [
          {
            type: 'controls',
            classes: ['awmvideo-novideo'],
            style: { width: '480px' }
          },
          { type: 'loading' },
          { type: 'error' },
          {
            if: function () {
              return (this.options.controls == 'stock');
            },
            then: { //show the video element if its controls will be used
              type: 'video',
              style: { position: 'absolute' }
            },
            else: { //hide the video element
              type: 'video',
              style: {
                position: 'absolute',
                display: 'none'
              }
            }
          }
        ],
      }
    },
    videocontainer: {
      type: 'container',
      children: [
        { type: 'videobackground', alwaysDisplay: false, delay: 5 },
        { type: 'video' }
      ]
    }, controls: {
      if: function () {
        return !!(this.player && this.player.api && this.player.api.play);
      },
      then: { //use this subsctructure for players that have an api with at least a play function available
        type: 'container',
        classes: ['awmvideo-column'],
        children: [
          {
            type: 'progress',
            classes: ['awmvideo-pointer']
          },
          {
            type: 'container',
            classes: ['awmvideo-main', 'awmvideo-padding', 'awmvideo-row', 'awmvideo-background'],
            children: [
              {
                type: 'play',
                classes: ['awmvideo-pointer']
              },
              { type: 'currentTime' },
              {
                if: function () {
                  //show the total time if the player size is larger than 300px
                  if (('size' in this) && (this.size.width > 300) || ((!this.info.hasVideo || (this.source.type.split('/')[1] == 'audio')))) {
                    return true;
                  }
                  return false;
                },
                then: { type: 'totalTime' }
              },
              {
                type: 'container',
                classes: ['awmvideo-align-right'],
                children: [
                  {
                    type: 'container',
                    children: [
                      {
                        type: 'container',
                        classes: ['awmvideo-volume_container'],
                        children: [{
                          type: 'volume',
                          mode: 'horizontal',
                          size: { height: 22 },
                          classes: ['awmvideo-pointer']
                        }]
                      },
                      {
                        type: 'speaker',
                        classes: ['awmvideo-pointer'],
                        style: { 'margin-left': '-2px' }
                      }
                    ]
                  },
                  {
                    if: function () {
                      //show the fullscreen and loop buttons here if the player size is larger than 200px
                      if (('size' in this) && (this.size.width > 200) || ((!this.info.hasVideo || (this.source.type.split('/')[1] == 'audio')))) {
                        return true;
                      }
                      return false;
                    },
                    then: {
                      type: 'container',
                      children: [{
                        type: 'loop',
                        classes: ['awmvideo-pointer']
                      },
                        {
                          type: 'fullscreen',
                          classes: ['awmvideo-pointer']
                        }]
                    }
                  },
                  {
                    type: 'hoverWindow',
                    mode: 'pos',
                    transition: {
                      hide: 'right: -1000px; bottom: 44px;',
                      show: 'right: 5px;',
                      viewport: 'right: 0; left: 0; bottom: 0; top: -1000px'
                    },
                    button: { type: 'settings', classes: ['awmvideo-pointer'] },
                    window: { type: 'submenu' }
                  }
                ]
              }
            ]
          }
        ]
      },
      else: { //use this subsctructure for players that don't have an api with at least a play function available
        if: function () {
          return !!(this.player && this.player.api);
        },
        then: { //use this subsctructure if some sort of api does exist
          type: 'hoverWindow',
          mode: 'pos',
          transition: {
            hide: 'right: -1000px; bottom: 44px;',
            show: 'right: 2.5px;',
            viewport: 'right: 0; left: -1000px; bottom: 0; top: -1000px'
          },
          style: { right: '5px', left: 'auto' },
          button: {
            type: 'settings',
            classes: ['awmvideo-background', 'awmvideo-padding'],
          },
          window: { type: 'submenu' }
        }
      }
    },
    submenu: {
      type: 'container',
      style: {
        'width': '80%',
        'maxWidth': '25em',
        'zIndex': 2
      },
      classes: ['awmvideo-padding', 'awmvideo-column', 'awmvideo-background'],
      children: [
        { type: 'tracks' },
        {
          if: function () {
            //only show the fullscreen and loop buttons here if the player size is less than 200px
            if (('size' in this) && (this.size.width <= 200)) {
              return true;
            }
            return false;
          },
          then: {
            type: 'container',
            classes: ['awmvideo-center'],
            children: [{
              type: 'loop',
              classes: ['awmvideo-pointer']
            },
              {
                type: 'fullscreen',
                classes: ['awmvideo-pointer']
              }]
          }
        }
      ]
    },
    placeholder: {
      type: 'container',
      classes: ['awmvideo', 'awmvideo-delay-display'],
      children: [
        { type: 'placeholder' },
        { type: 'loading' },
        { type: 'error' }
      ]
    },
    secondaryVideo: function (switchThese) {
      return {
        type: 'hoverWindow',
        classes: ['awmvideo'],
        mode: 'pos',
        transition: {
          hide: 'left: 10px; bottom: -40px;',
          show: 'bottom: 10px;',
          viewport: 'left: 0; right: 0; top: 0; bottom: 0'
        },
        button: {
          type: 'container',
          children: [{ type: 'videocontainer' }]
        },
        window: {
          type: 'switchVideo',
          classes: ['awmvideo-controls', 'awmvideo-padding', 'awmvideo-background', 'awmvideo-pointer'],
          containers: switchThese
        }
      };
    }
  },
  css: {
    skin: awmhost + '/skins/default.css'
  },
  icons: {
    blueprints: {
      play: {
        size: 45,
        svg: '<path d="M6.26004984594 3.0550109625C5.27445051914 3.68940862462 4.67905105702 4.78142391497 4.67968264562 5.95354422781C4.67968264562 5.95354422781 4.70004942312 39.0717540916 4.70004942312 39.0717540916C4.70302341604 40.3033886636 5.36331656075 41.439734231 6.43188211452 42.0521884912C7.50044766829 42.6646427515 8.81469531629 42.6600161659 9.87892235656 42.0400537716C9.87892235656 42.0400537716 38.5612768409 25.4802882606 38.5612768409 25.4802882606C39.6181165777 24.8606067582 40.2663250096 23.7262617523 40.2636734301 22.5011460995C40.2610218505 21.2760304467 39.6079092743 20.1445019555 38.5483970356 19.5294009803C38.5483970356 19.5294009803 9.84567577375 2.9709566275 9.84567577375 2.9709566275C8.72898008118 2.32550764609 7.34527425735 2.35794451351 6.26004984594 3.0550109625C6.26004984594 3.0550109625 6.26004984594 3.0550109625 6.26004984594 3.0550109625" class="fill" />'
      },
      largeplay: {
        size: 45,
        svg: '<path d="M6.26004984594 3.0550109625C5.27445051914 3.68940862462 4.67905105702 4.78142391497 4.67968264562 5.95354422781C4.67968264562 5.95354422781 4.70004942312 39.0717540916 4.70004942312 39.0717540916C4.70302341604 40.3033886636 5.36331656075 41.439734231 6.43188211452 42.0521884912C7.50044766829 42.6646427515 8.81469531629 42.6600161659 9.87892235656 42.0400537716C9.87892235656 42.0400537716 38.5612768409 25.4802882606 38.5612768409 25.4802882606C39.6181165777 24.8606067582 40.2663250096 23.7262617523 40.2636734301 22.5011460995C40.2610218505 21.2760304467 39.6079092743 20.1445019555 38.5483970356 19.5294009803C38.5483970356 19.5294009803 9.84567577375 2.9709566275 9.84567577375 2.9709566275C8.72898008118 2.32550764609 7.34527425735 2.35794451351 6.26004984594 3.0550109625C6.26004984594 3.0550109625 6.26004984594 3.0550109625 6.26004984594 3.0550109625" class="stroke" />'
      },
      pause: {
        size: 45,
        svg: '<g><path d="m 7.5,38.531275 a 4.0011916,4.0011916 0 0 0 3.749999,3.96873 l 2.2812501,0 a 4.0011916,4.0011916 0 0 0 3.96875,-3.75003 l 0,-32.28123 a 4.0011916,4.0011916 0 0 0 -3.75,-3.96875 l -2.2812501,0 a 4.0011916,4.0011916 0 0 0 -3.968749,3.75 l 0,32.28128 z" class="fill" /><path d="m 27.5,38.531275 a 4.0011916,4.0011916 0 0 0 3.75,3.9687 l 2.28125,0 a 4.0011916,4.0011916 0 0 0 3.96875,-3.75 l 0,-32.28126 a 4.0011916,4.0011916 0 0 0 -3.75,-3.96875 l -2.28125,0 a 4.0011916,4.0011916 0 0 0 -3.96875,3.75 l 0,32.28131 z" class="fill" /></g>'
      },
      speaker: {
        size: 45,
        svg: '<path d="m 32.737813,5.2037363 c -1.832447,-1.10124 -4.200687,-0.8622 -5.771871,0.77112 0,0 -7.738819,8.0443797 -7.738819,8.0443797 0,0 -3.417976,0 -3.417976,0 -1.953668,0 -3.54696,1.65618 -3.54696,3.68694 0,0 0,9.58644 0,9.58644 0,2.03094 1.593292,3.68712 3.54696,3.68712 0,0 3.417976,0 3.417976,0 0,0 7.738819,8.04474 7.738819,8.04474 1.572104,1.63404 3.938942,1.8747 5.771871,0.77076 0,0 0,-34.5914997 0,-34.5914997 z" class="stroke semiFill toggle" />'
      },
      volume: {
        size: { width: 100, height: 45 },
        svg: function () {
          var uid = AwmUtil.createUnique();
          return '<defs><mask id="' + uid + '"><path d="m6.202 33.254 86.029-28.394c2.6348-0.86966 4.7433 0.77359 4.7433 3.3092v28.617c0 1.9819-1.6122 3.5773-3.6147 3.5773h-86.75c-4.3249 0-5.0634-5.5287-0.40598-7.1098" fill="#fff" /></mask></defs><rect mask="url(#' + uid + ')" class="slider horizontal semiFill" width="100%" height="100%" /><path d="m6.202 33.254 86.029-28.394c2.6348-0.86966 4.7433 0.77359 4.7433 3.3092v28.617c0 1.9819-1.6122 3.5773-3.6147 3.5773h-86.75c-4.3249 0-5.0634-5.5287-0.40598-7.1098" class="stroke" /><rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.001)"/>'; //rectangle added because Edge won't trigger mouse events above transparent areas
        }
      },
      muted: {
        size: 45,
        svg: '<g class="stroke" stroke-linecap="round" vector-effect="none" stroke-width="2"><path d="m25.587 5.2036c-1.8324-1.1012-4.2007-0.8622-5.7719 0.77112 0 0-7.7388 8.0444-7.7388 8.0444h-3.418c-1.9537 0-3.547 1.6562-3.547 3.6869v9.5864c0 2.0309 1.5933 3.6871 3.547 3.6871h3.418s7.7388 8.0447 7.7388 8.0447c1.5721 1.634 3.9389 1.8747 5.7719 0.77076v-34.591 z" /><path d="m30.032 27.86 9.8517-9.8517"/><path d="m30.032 18.008 9.8517 9.8517"/></g>'
      },
      fullscreen: {
        size: 45,
        svg: '<path d="m2.5 10.928v8.5898l4.9023-2.8008 9.6172 5.7832-9.6172 5.7832-4.9023-2.8008v8.5898h15.031l-4.9004-2.8008 9.8691-5.6387 9.8691 5.6387-4.9004 2.8008h15.031v-8.5898l-4.9023 2.8008-9.6172-5.7832 9.6172-5.7832 4.9023 2.8008v-8.5898h-15.033l4.9023 2.8008-9.8691 5.6387-9.8691-5.6387 4.9023-2.8008z" class="fill">'
      },
      loop: {
        size: 45,
        svg: '<path d="M 21.279283,3.749797 A 18.750203,18.750203 0 0 0 8.0304417,9.2511582 L 12.740779,13.961496 A 12.083464,12.083464 0 0 1 21.279283,10.416536 12.083464,12.083464 0 0 1 33.362748,22.5 12.083464,12.083464 0 0 1 21.279283,34.583464 12.083464,12.083464 0 0 1 12.740779,31.038504 l 3.063185,-3.063185 H 4.9705135 V 38.80877 L 8.0304417,35.748842 A 18.750203,18.750203 0 0 0 21.279283,41.250203 18.750203,18.750203 0 0 0 40.029486,22.5 18.750203,18.750203 0 0 0 21.279283,3.749797 Z" class="stroke semiFill toggle" />'
      },
      settings: {
        size: 45,
        svg: '<path d="m24.139 3.834-1.4785 4.3223c-1.1018 0.0088-2.2727 0.13204-3.2031 0.33594l-2.3281-3.9473c-1.4974 0.45304-2.9327 1.091-4.2715 1.9004l1.3457 4.3672c-0.87808 0.62225-1.685 1.3403-2.4023 2.1426l-4.1953-1.8223c-0.9476 1.2456-1.7358 2.6055-2.3457 4.0469l3.6523 2.7383c-0.34895 1.0215-0.58154 2.0787-0.69336 3.1523l-4.4531 0.98828c-0.00716 0.14696-0.011931 0.29432-0.015625 0.44141 0.00628 1.4179 0.17336 2.8307 0.49805 4.2109l4.5703 0.070312c0.32171 1.0271 0.75826 2.0138 1.3008 2.9434l-3.0391 3.4355c0.89502 1.2828 1.9464 2.4492 3.1309 3.4707l3.7363-2.6289c0.86307 0.64582 1.7958 1.192 2.7812 1.6289l-0.43555 4.541c1.4754 0.52082 3.0099 0.85458 4.5684 0.99414l1.4766-4.3223c0.05369 3e-3 0.10838 0.005313 0.16211 0.007812 1.024-0.0061 2.0436-0.12048 3.043-0.34375l2.3281 3.9473c1.4974-0.45304 2.9327-1.091 4.2715-1.9004l-1.3457-4.3672c0.87808-0.62225 1.685-1.3403 2.4023-2.1426l4.1953 1.8223c0.9476-1.2456 1.7358-2.6055 2.3457-4.0469l-3.6523-2.7383c0.34895-1.0215 0.58154-2.0787 0.69336-3.1523l4.4531-0.98828c0.0072-0.14698 0.011925-0.29432 0.015625-0.44141-0.0062-1.4179-0.17336-2.8307-0.49805-4.2109l-4.5703-0.070312c-0.32171-1.0271-0.75826-2.0138-1.3008-2.9434l3.0391-3.4355c-0.89502-1.2828-1.9464-2.4492-3.1309-3.4707l-3.7363 2.6289c-0.86307-0.64582-1.7958-1.192-2.7812-1.6289l0.43555-4.541c-1.4754-0.52082-3.0099-0.85457-4.5684-0.99414zm-1.6387 7.8789a10.786 10.786 0 0 1 10.787 10.787 10.786 10.786 0 0 1-10.787 10.787 10.786 10.786 0 0 1-10.787-10.787 10.786 10.786 0 0 1 10.787-10.787z" class="fill"/>'
      },
      loading: {
        size: 100,
        svg: '<path d="m49.998 8.7797e-4c-0.060547 0.0018431-0.12109 0.0037961-0.18164 0.0058593-0.1251 0.0015881-0.25012 0.0061465-0.375 0.013672h-0.001954c-27.388 0.30599-49.432 22.59-49.439 49.98 0.020074 2.6488 0.25061 5.292 0.68945 7.904 3.8792-24.231 24.77-42.065 49.311-42.096v-0.0058582h0.001954c4.3638 3.0803e-4 7.9013-3.5366 7.9021-7.9002 1.474e-4 -2.0958-0.83235-4.106-2.3144-5.5879-1.482-1.482-3.492-2.3145-5.5879-2.3144-6.5007e-4 -7.9369e-8 -0.0013001-7.9369e-8 -0.001954 0" class="semiFill spin"></path>'
      },
      timeout: {
        size: 25,
        svg: function (options) {
          if ((!options) || (!options.delay)) {
            options = { delay: 10 };
          }
          var delay = options.delay;
          var uid = AwmUtil.createUnique();
          return '<defs><mask id="' + uid + '"><rect x="0" y="0" width="25" height="25" fill="#fff"/><rect x="-5" y="-5" width="17.5" height="35" fill="#000" transform="rotate(180,12.5,12.5)"><animateTransform attributeName="transform" type="rotate" from="0,12.5,12.5" to="180,12.5,12.5" begin="DOMNodeInsertedIntoDocument" dur="' + (delay / 2) + 's" repeatCount="1"/></rect><rect x="0" y="0" width="12.5" height="25" fill="#fff"/><rect x="-5" y="-5" width="17.5" height="35" fill="#000" transform="rotate(360,12.5,12.5)"><animate attributeType="CSS" attributeName="opacity" from="0" to="1" begin="DOMNodeInsertedIntoDocument" dur="' + (delay) + 's" calcMode="discrete" repeatCount="1" /><animateTransform attributeName="transform" type="rotate" from="180,12.5,12.5" to="360,12.5,12.5" begin="DOMNodeInsertedIntoDocument+' + (delay / 2) + 's" dur="' + (delay / 2) + 's" repeatCount="1"/></rect><circle cx="12.5" cy="12.5" r="8" fill="#000"/></mask></defs><circle cx="12.5" cy="12.5" r="12.5" class="fill" mask="url(#' + uid + ')"/>';
        }
      },
      popout: {
        size: 45,
        svg: '<path d="m24.721 11.075c-12.96 0.049575-32.113 15.432-10.336 28.834-7.6763-7.9825-2.4795-21.824 10.336-22.19v5.5368l15.276-8.862-15.276-8.86v5.5419z" class="stroke fill"/>'
      },
      switchvideo: {
        size: 45,
        svg: '<path d="m8.4925 18.786c-3.9578 1.504-6.4432 3.632-6.4434 5.9982 2.183e-4 4.1354 7.5562 7.5509 17.399 8.1467v4.7777l10.718-6.2573-10.718-6.2529v4.5717c-6.9764-0.4712-12.229-2.5226-12.227-4.9859 6.693e-4 -0.72127 0.45868-1.4051 1.2714-2.0267zm28.015 0v3.9715c0.81164 0.62126 1.2685 1.3059 1.2692 2.0267-0.0014 1.4217-1.791 2.75-4.8021 3.6968-2.0515 0.82484-0.93693 3.7696 1.2249 2.9659 5.3088-1.8593 8.7426-3.8616 8.7514-6.6627-1.26e-4 -2.3662-2.4856-4.4942-6.4434-5.9982z" class="fill"/><rect rect x="10.166" y="7.7911" width="24.668" height="15.432" class="stroke"/>'
      }
    }
  },
  blueprints: {
    container: function () {
      var container = document.createElement('div');

      return container;
    },
    video: function () {
      var AwmVideo = this;

      //disable right click
      AwmUtil.event.addListener(AwmVideo.video, 'contextmenu', function (e) {
        e.preventDefault();

        //also do something useful
        //show submenu
        AwmVideo.container.setAttribute('data-show-submenu', '');
        AwmVideo.container.removeAttribute('data-hide-submenu');
        AwmVideo.container.removeAttribute('data-hidecursor');
        //onmouseout, hide submenu
        var f = function () {
          AwmVideo.container.removeAttribute('data-show-submenu');
          AwmVideo.container.removeEventListener('mouseout', f);
        };
        AwmUtil.event.addListener(AwmVideo.container, 'mouseout', f);
      });

      //hide the cursor after some time
      AwmVideo.video.hideTimer = false;
      AwmVideo.video.hideCursor = function () {
        if (this.hideTimer) {
          clearTimeout(this.hideTimer);
        }
        this.hideTimer = AwmVideo.timers.start(function () {
          AwmVideo.container.setAttribute('data-hidecursor', '');
          var controlsContainer = AwmVideo.container.querySelector('.awmvideo-controls');
          if (controlsContainer) {
            controlsContainer.parentNode.setAttribute('data-hidecursor', '');
          }
        }, 3e3);
      };
      AwmUtil.event.addListener(AwmVideo.video, 'mousemove', function () {
        AwmVideo.container.removeAttribute('data-hidecursor');
        var controlsContainer = AwmVideo.container.querySelector('.awmvideo-controls');
        if (controlsContainer) {
          controlsContainer.parentNode.removeAttribute('data-hidecursor');
        }
        AwmVideo.video.hideCursor();
      });
      AwmUtil.event.addListener(AwmVideo.video, 'mouseout', function () {
        //stop the timer if no longer over the video element
        if (AwmVideo.video.hideTimer) {
          AwmVideo.timers.stop(AwmVideo.video.hideTimer);
        }
      });

      //improve autoplay behaviour
      if (AwmVideo.options.autoplay) {
        //because Awm doesn't send data instantly (but real time), it can take a little while before canplaythrough is fired. Rather than wait, we can just start playing at the canplay event
        var canplay = AwmUtil.event.addListener(AwmVideo.video, 'canplay', function () {
          if (AwmVideo.player.api && AwmVideo.player.api.paused) {
            var promise = AwmVideo.player.api.play();
            if (promise) {
              promise.catch(function () {
                if (AwmVideo.destroyed) {
                  return;
                }
                AwmVideo.log('Autoplay failed. Retrying with muted audio..');
                //play has failed

                if (AwmVideo.info.hasVideo) {
                  //try again with sound muted
                  AwmVideo.player.api.muted = true;
                  //safari doesn't send this event themselves..
                  AwmUtil.event.send('volumechange', null, AwmVideo.video);

                  var promise = AwmVideo.player.api.play();
                  if (promise) {
                    promise.then(function () {
                      if (AwmVideo.reporting) {
                        AwmVideo.reporting.stats.d.autoplay = 'success';
                      }
                    }).then(function () {
                      if (AwmVideo.destroyed) {
                        return;
                      }

                      AwmVideo.log('Autoplay worked! Video will be unmuted on mouseover if the page has been interacted with.');

                      if (AwmVideo.reporting) {
                        AwmVideo.reporting.stats.d.autoplay = 'muted';
                      }

                      //show large "muted" icon
                      var largeMutedButton = AwmVideo.skin.icons.build('muted', 100);
                      AwmUtil.class.add(largeMutedButton, 'awmvideo-pointer');
                      AwmVideo.container.appendChild(largeMutedButton);
                      AwmUtil.event.addListener(largeMutedButton, 'click', function () {
                        AwmVideo.player.api.muted = false;
                        AwmVideo.container.removeChild(largeMutedButton);
                      });

                      //listen for page interactions
                      var interacted = false;
                      var i = function () {
                        interacted = true;
                        document.body.removeEventListener('click', i);
                      };
                      AwmUtil.event.addListener(document.body, 'click', i, AwmVideo.video);


                      //turn sound back on on mouseover
                      var f = function () {
                        if (interacted) {
                          AwmVideo.player.api.muted = false;
                          AwmVideo.video.removeEventListener('mouseenter', f);
                          AwmVideo.log('Re-enabled sound');
                        }
                      };
                      AwmUtil.event.addListener(AwmVideo.video, 'mouseenter', f);

                      //remove all the things when unmuted
                      var fu = function () {
                        if (!AwmVideo.video.muted) {
                          if (largeMutedButton.parentNode) {
                            AwmVideo.container.removeChild(largeMutedButton);
                          }
                          AwmVideo.video.removeEventListener('volumechange', fu);
                          document.body.removeEventListener('click', i);
                          AwmVideo.video.removeEventListener('mouseenter', f);
                        }
                      };
                      AwmUtil.event.addListener(AwmVideo.video, 'volumechange', fu);

                    }).catch(function(){
                      if (AwmVideo.destroyed) { return; }
                      AwmVideo.log('Autoplay failed even with muted video. Unmuting and showing play button.');
                      //wait 5 seconds and then pause the download
                      AwmVideo.timers.start(function(){
                        if (AwmVideo.player.api.paused) {
                          //don't question it
                          //if the video is paused, also request the player api to pause
                          //for example, for mews, this would pause the download
                          AwmVideo.player.api.pause();
                          if (AwmVideo.monitor) { AwmVideo.monitor.destroy(); }
                        }
                      },5e3);

                      if (AwmVideo.reporting) { AwmVideo.reporting.stats.d.autoplay = 'failed'; }
                      AwmVideo.player.api.muted = false;

                      //play has failed

                      //show large centered play button
                      var largePlayButton = AwmVideo.skin.icons.build('largeplay',150);
                      AwmUtil.class.add(largePlayButton,'awmvideo-pointer');
                      AwmVideo.container.appendChild(largePlayButton);

                      //start playing on click
                      AwmUtil.event.addListener(largePlayButton,'click',function(){
                        if (AwmVideo.player.api.paused) {
                          AwmVideo.player.api.play();
                        }
                      });

                      //remove large button on play
                      var f = function (){
                        AwmVideo.container.removeChild(largePlayButton);
                        AwmVideo.video.removeEventListener('play',f);
                      };
                      AwmUtil.event.addListener(AwmVideo.video,'play',f);

                    });
                  }
                } else if (AwmVideo.reporting) {
                  AwmVideo.reporting.stats.d.autoplay = 'failed';
                }
              });
            }
          } else if (AwmVideo.reporting) {
            AwmVideo.reporting.stats.d.autoplay = 'success';
          }

          AwmUtil.event.removeListener(canplay); //only fire once
        });
      }

      return this.video;
    },
    videocontainer: function () {
      return this.UI.buildStructure(this.skin.structure.videocontainer);
    },
    secondaryVideo: function (o) {
      if (!o) {
        o = {};
      }
      if (!o.options) {
        o.options = {};
      }

      var AwmVideo = this;

      if (!('secondary' in AwmVideo)) {
        AwmVideo.secondary = [];
      }

      var options = AwmUtil.object.extend({}, AwmVideo.options);
      options = AwmUtil.object.extend(options, o.options);
      AwmVideo.secondary.push(options);

      var pointer = {
        primary: AwmVideo,
        secondary: false
      };

      options.target = document.createElement('div');
      delete options.container;

      var mvo = {};
      options.AwmVideoObject = mvo;

      AwmUtil.event.addListener(options.target, 'initialized', function () {
        var mv = mvo.reference;
        //options.callback = function(mv){
        options.AwmVideo = mv; //tell the main video we exist
        pointer.secondary = mv;

        mv.player.api.muted = true; //disable sound
        mv.player.api.loop = false; //disable looping, master will do that for us

        //as all event listeners are tied to the video element (not the container), events don't bubble up and disturb higher players

        //prevent clicks on the control container from bubbling down to underlying elements
        var controlContainers = options.target.querySelectorAll('.awmvideo-controls');
        for (var i = 0; i < controlContainers.length; i++) {
          AwmUtil.event.addListener(controlContainers[i], 'click', function (e) {
            e.stopPropagation();
          });
        }

        //ensure the state of the main player is copied
        AwmUtil.event.addListener(AwmVideo.video, 'play', function () {
          if (mv.player.api.paused) {
            mv.player.api.play();
          }
        }, options.target);
        AwmUtil.event.addListener(AwmVideo.video, 'pause', function () {
          if (!mv.player.api.paused) {
            mv.player.api.pause();
          }
        }, options.target);
        AwmUtil.event.addListener(AwmVideo.video, 'seeking', function () {
          mv.player.api.currentTime = this.currentTime;
        }, options.target);
        AwmUtil.event.addListener(AwmVideo.video, 'timeupdate', function () {
          if (mv.player.api.pausedesync) {
            return;
          }

          //sync
          var desync = this.currentTime - mv.player.api.currentTime;
          var adesync = Math.abs(desync);
          if (adesync > 30) {
            mv.player.api.pausedesync = true;
            mv.player.api.currentTime = this.currentTime;
            mv.log('Re-syncing with main video by seeking (desync: ' + desync + 's)');
          } else if (adesync > 0.01) {
            var rate = 0.1;
            if (adesync < 1) {
              rate = 0.05;
            }
            rate = 1 + rate * Math.sign(desync);
            if (rate != mv.player.api.playbackRate) {
              mv.log('Re-syncing by changing the playback rate (desync: ' + Math.round(desync * 1e3) + 'ms, rate: ' + rate + ')');
            }
            mv.player.api.playbackRate = rate;
          } else if (mv.player.api.playbackRate != 1) {
            mv.player.api.playbackRate = 1;
            mv.log('Sync with main video achieved (desync: ' + Math.round(desync * 1e3) + 'ms)');
          }
        }, options.target);
        AwmUtil.event.addListener(mv.video, 'seeked', function () {
          //don't attempt to correct sync if we're already seeking
          mv.player.api.pausedesync = false;
        });

      });
      options.skin = AwmUtil.object.extend({}, AwmVideo.skin, true);
      options.skin.structure.main = AwmUtil.object.extend({}, AwmVideo.skin.structure.secondaryVideo(pointer));

      awmPlay(AwmVideo.stream, options);

      return options.target;
    },
    switchVideo: function (options) {
      var container = document.createElement('div');

      container.appendChild(this.skin.icons.build('switchvideo'));

      AwmUtil.event.addListener(container, 'click', function () {
        var primary = options.containers.primary;
        var secondary = options.containers.secondary;

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

        //find video element in primary/secondary containers
        var pv = findVideo(primary, primary.options.target);
        var sv = findVideo(primary, secondary.options.target);
        //prevent pausing the primary
        var playit = !pv.paused;
        //switch them
        var place = document.createElement('div');
        sv.parentElement.insertBefore(place, sv);
        pv.parentElement.insertBefore(sv, pv);
        place.parentElement.insertBefore(pv, place);
        place.parentElement.removeChild(place);
        if (playit) {
          try {
            pv.play();
            sv.play();
          } catch (e) {
          }
        }

        var tmp = {
          width: pv.style.width,
          height: pv.style.height,
          currentTarget: pv.currentTarget
        };/*
        pv.style.width = sv.style.width;
        pv.style.height = sv.style.height;
        sv.style.width = tmp.width;
        sv.style.height = tmp.height;*/
        pv.currentTarget = sv.currentTarget;
        sv.currentTarget = tmp.currentTarget;
        primary.player.resizeAll();
      });

      return container;
    },
    controls: function () {
      if ((this.options.controls) && (this.options.controls != 'stock')) {
        AwmUtil.class.add(this.container, 'hasControls');

        var container = this.UI.buildStructure(this.skin.structure.controls);
        if (AwmUtil.isTouchDevice()) {
          container.style.zoom = 1.5;
        }
        return container;
      }
    },
    submenu: function () {
      return this.UI.buildStructure(this.skin.structure.submenu);
    },
    hoverWindow: function (options) {

      //rewrite to a container with specific classes and continue the buildStructure call

      var structure = {
        type: 'container',
        classes: ('classes' in options ? options.classes : []),
        children: ('children' in options ? options.children : [])
      };


      structure.classes.push('hover_window_container');
      if (!('classes' in options.window)) {
        options.window.classes = [];
      }
      options.window.classes.push('inner_window');
      options.window.classes.push('awmvideo-container');
      options.window = {
        type: 'container',
        classes: ['outer_window'],
        children: [options.window]
      };

      if (!('classes' in options.button)) {
        options.button.classes = [];
      }
      options.button.classes.push('pointer');

      switch (options.mode) {
        case 'left':
          structure.classes.push('horizontal');
          structure.children = [options.window, options.button];
          break;
        case 'right':
          structure.classes.push('horizontal');
          structure.children = [options.button, options.window];
          break;
        case 'top':
          structure.classes.push('vertical');
          structure.children = [options.button, options.window];
          break;
        case 'bottom':
          structure.classes.push('vertical');
          structure.children = [options.window, options.button];
          break;
        case 'pos':
          structure.children = [options.button, options.window];
          if (!('classes' in options.window)) {
            options.window.classes = [];
          }
          break;
        default:
          throw 'Unsupported mode for structure type hoverWindow';
      }

      if ('transition' in options) {

        if (!('css' in structure)) {
          structure.css = [];
        }
        structure.css.push(
          '.hover_window_container:hover > .outer_window:not([data-hidecursor]) > .inner_window { ' + options.transition.show + ' }\n' +
          '.hover_window_container > .outer_window { ' + options.transition.viewport + ' }\n' +
          '.hover_window_container > .outer_window > .inner_window { ' + options.transition.hide + ' }'
        );

      }

      structure.classes.push(options.mode);

      return this.UI.buildStructure(structure);
    },
    draggable: function (options) {
      var container = this.skin.blueprints.container(options);
      var AwmVideo = this;

      var button = this.skin.icons.build('fullscreen', 16);
      AwmUtil.class.remove(button, 'fullscreen');
      AwmUtil.class.add(button, 'draggable-icon');
      container.appendChild(button);
      button.style.alignSelf = 'flex-end';
      button.style.position = 'absolute';
      button.style.cursor = 'move';

      var offset = {};
      var move = function (e) {
        container.style.left = (e.clientX - offset.x) + 'px';
        container.style.top = (e.clientY - offset.y) + 'px';
      };
      var stop = function () {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('click', stop);

        AwmUtil.event.addListener(button, 'click', start);
      };
      var start = function (e) {
        e.stopPropagation();

        button.removeEventListener('click', start);

        offset.x = AwmVideo.container.getBoundingClientRect().left - (container.getBoundingClientRect().left - e.clientX);
        offset.y = AwmVideo.container.getBoundingClientRect().top - (container.getBoundingClientRect().top - e.clientY);

        container.style.position = 'absolute';
        container.style.right = 'auto';
        container.style.bottom = 'auto';
        AwmVideo.container.appendChild(container);
        move(e);

        //container.style.resize = "both";

        AwmUtil.event.addListener(window, 'mousemove', move, container);
        AwmUtil.event.addListener(window, 'click', stop, container);
      };

      AwmUtil.event.addListener(button, 'click', start);

      return container;
    },
    progress: function () {

      //the outer container is div.progress, which contains div.bar and multiple div.buffer-s
      var margincontainer = document.createElement('div');

      var container = document.createElement('div');
      margincontainer.appendChild(container);

      container.kids = {};

      container.kids.bar = document.createElement('div');
      container.kids.bar.className = 'bar';
      container.appendChild(container.kids.bar);

      var video = this.video;
      var AwmVideo = this;

      //these functions update the states
      container.updateBar = function (currentTime) {
        if (this.kids.bar) {
          if (!isFinite(AwmVideo.player.api.duration)) {
            this.kids.bar.style.display = 'none';
            return;
          } else {
            this.kids.bar.style.display = '';
          }

          let w = Math.min(1, Math.max(0, this.time2perc(currentTime)));
          this.kids.bar.style.width = w * 100 + '%';
        }
      };
      container.time2perc = function (time) {
        if (!isFinite(AwmVideo.player.api.duration)) {
          return 0;
        }
        var result = 0;
        if (AwmVideo.info.type == 'live') {
          var buffer_window = AwmVideo.info.meta.buffer_window * 1e-3;
          result = (time - AwmVideo.player.api.duration + buffer_window) / buffer_window;
        } else {
          result = time / AwmVideo.player.api.duration;
        }
        return Math.min(1, Math.max(0, result));
      };
      container.buildBuffer = function (start, end) {
        var buffer = document.createElement('div');
        buffer.className = 'buffer';
        buffer.style.left = (this.time2perc(start) * 100) + '%';
        buffer.style.width = ((this.time2perc(end) - this.time2perc(start)) * 100) + '%';
        return buffer;
      };
      container.updateBuffers = function (buffers) {
        //clear old buffer-divs
        var old = this.querySelectorAll('.buffer');
        for (var i = 0; i < old.length; i++) {
          this.removeChild(old[i]);
        }

        //add new buffer-divs
        if (buffers) {
          for (var i = 0; i < buffers.length; i++) {
            this.appendChild(this.buildBuffer(
              buffers.start(i),
              buffers.end(i)
            ));
          }
        }
      };

      //obey video states
      var lastBufferUpdate = 0;
      var bufferTimer = false;
      AwmUtil.event.addListener(video, 'progress', function () {
        function updateBuffers() {
          //limit fire to once per second
          if (new Date().getTime() - lastBufferUpdate > 1e3) {
            container.updateBuffers(AwmVideo.player.api.buffered);
            lastBufferUpdate = new Date().getTime();
          } else if (!bufferTimer) {
            bufferTimer = AwmVideo.timers.start(function () {
              updateBuffers();
              bufferTimer = false;
            }, 1e3);
          }
        }

        updateBuffers();
      }, container);
      var lastBarUpdate = 0;
      var barTimer = false;
      AwmUtil.event.addListener(video, 'timeupdate', function () {
        function updateBar() {
          //console.log(video.currentTime,"timeupdate");
          //limit fire to once per 0.2 second
          if ((new Date().getTime() - lastBarUpdate > 200) && (!dragging)) {
            container.updateBar(AwmVideo.player.api.currentTime);
            lastBarUpdate = new Date().getTime();
          } else if (!barTimer) {
            barTimer = AwmVideo.timers.start(function () {
              updateBar();
              barTimer = false;
            }, 1e3);
          }
        }

        updateBar();
      }, container);
      AwmUtil.event.addListener(video, 'seeking', function () {
        container.updateBar(AwmVideo.player.api.currentTime);
      }, container);

      //control video states
      container.getPos = function (e) {
        var perc = AwmUtil.getPos(this, e);
        if (AwmVideo.info.type == 'live') {
          //live mode: seek in DVR window
          var bufferWindow = AwmVideo.info.meta.buffer_window * 1e-3; //buffer window in seconds
          //assuming the "right" part or the progressbar is at true live
          return (perc - 1) * bufferWindow + AwmVideo.player.api.duration;
        } else {
          //VOD mode
          if (!isFinite(AwmVideo.player.api.duration)) {
            return false;
          }
          return perc * AwmVideo.player.api.duration;
        }
      };
      //seeking
      container.seek = function (e) {
        var pos = this.getPos(e);
        AwmVideo.player.api.currentTime = pos;
      };
      AwmUtil.event.addListener(margincontainer, 'mouseup', function (e) {
        if (e.which != 1) {
          return;
        } //only respond to left mouse clicks
        container.seek(e);
      });

      //hovering
      var tooltip = AwmVideo.UI.buildStructure({ type: 'tooltip' });
      tooltip.style.opacity = 0;
      container.appendChild(tooltip);
      AwmUtil.event.addListener(margincontainer, 'mouseout', function () {
        if (!dragging) {
          tooltip.style.opacity = 0;
        }
      });
      container.moveTooltip = function (e) {
        var secs = this.getPos(e);
        if (secs === false) {
          //the tooltip isn't going to make sense
          tooltip.style.opacity = 0;
          return;
        }
        tooltip.setText(AwmUtil.format.time(secs));
        tooltip.style.opacity = 1;

        var perc = AwmUtil.getPos(this, e);// e.clientX - this.getBoundingClientRect().left;
        var pos = { bottom: 20 };
        //if the cursor is on the left side of the progress bar, show tooltip on the right of the cursor, otherwise, show it on the left side
        if (perc > 0.5) {
          pos.right = (1 - perc) * 100 + '%';
          tooltip.triangle.setMode('bottom', 'right');
        } else {
          pos.left = perc * 100 + '%';
          tooltip.triangle.setMode('bottom', 'left');
        }
        tooltip.setPos(pos);
      };
      AwmUtil.event.addListener(margincontainer, 'mousemove', function (e) {
        container.moveTooltip(e);
      });
      //TODO for live seeking, maybe show a tooltip at start and end with the apprioprate times as well?

      //dragging
      var dragging = false;
      AwmUtil.event.addListener(margincontainer, 'mousedown', function (e) {
        if (e.which != 1) {
          return;
        } //only respond to left mouse clicks

        dragging = true;

        container.updateBar(container.getPos(e));

        var moveListener = AwmUtil.event.addListener(document, 'mousemove', function (e) {
          container.updateBar(container.getPos(e));
          container.moveTooltip(e);
        }, container);


        var upListener = AwmUtil.event.addListener(document, 'mouseup', function (e) {
          if (e.which != 1) {
            return;
          } //only respond to left mouse clicks
          dragging = false;

          //remove mousemove and up
          AwmUtil.event.removeListener(moveListener);
          AwmUtil.event.removeListener(upListener);

          tooltip.style.opacity = 0;

          //trigger seek
          if ((!e.path) || (AwmUtil.array.indexOf(e.path, margincontainer) < 0)) { //it's not already triggered by onmouseup
            container.seek(e);
          }
        }, container);
      });

      return margincontainer;
    },
    play: function () {
      var AwmVideo = this;
      var button = document.createElement('div');

      button.appendChild(this.skin.icons.build('play'));
      button.appendChild(this.skin.icons.build('pause'));

      button.setState = function (state) {
        this.setAttribute('data-state', state);
      };
      button.setState('paused');

      var video = this.video;
      //obey video states
      AwmUtil.event.addListener(video, 'playing', function () {
        button.setState('playing');
        AwmVideo.options.autoplay = true;
      }, button);
      AwmUtil.event.addListener(video, 'pause', function () {
        button.setState('paused');
      }, button);
      AwmUtil.event.addListener(video, 'paused', function () {
        button.setState('paused');
      }, button);
      AwmUtil.event.addListener(video, 'ended', function () {
        button.setState('paused');
      }, button);

      //control video states
      AwmUtil.event.addListener(button, 'click', function () {
        if (AwmVideo.player.api.error) {
          AwmVideo.player.api.load();
        }
        if (AwmVideo.player.api.paused) {
          AwmVideo.player.api.play();
        } else {
          AwmVideo.player.api.pause();
          AwmVideo.options.autoplay = false;
        }
      });

      //toggle play/pause on click on video container
      if (AwmVideo.player.api) {
        AwmUtil.event.addListener(AwmVideo.video, 'click', function () {
          if (AwmVideo.player.api.paused) {
            AwmVideo.player.api.play();
          } else if (!AwmUtil.isTouchDevice()) {
            AwmVideo.player.api.pause();
            AwmVideo.options.autoplay = false;
          }
        }, button);
      }

      return button;
    },
    speaker: function () {

      var hasaudio = false;
      var tracks = this.info.meta.tracks;
      for (var i in tracks) {
        if (tracks[i].type == 'audio') {
          hasaudio = true;
          break;
        }
      }
      if (!hasaudio) {
        return false;
      }

      var button = this.skin.icons.build('speaker');
      var AwmVideo = this;

      var video = this.video;
      //obey video states
      AwmUtil.event.addListener(video, 'volumechange', function () {
        if ((AwmVideo.player.api.volume) && (!AwmVideo.player.api.muted)) {
          AwmUtil.class.remove(button, 'off');
        } else {
          AwmUtil.class.add(button, 'off');
        }
      }, button);

      //control video states
      AwmUtil.event.addListener(button, 'click', function () {
        AwmVideo.player.api.muted = !AwmVideo.player.api.muted;
      });

      return button;
    },
    volume: function (options) {

      var hasaudio = false;
      var tracks = this.info.meta.tracks;
      for (var i in tracks) {
        if (tracks[i].type == 'audio') {
          hasaudio = true;
          break;
        }
      }
      if (!hasaudio) {
        return false;
      }

      var container = document.createElement('div');
      var button = this.skin.icons.build('volume', ('size' in options ? options.size : false));
      container.appendChild(button);
      var AwmVideo = this;

      button.mode = ('mode' in options ? options.mode : 'vertical');
      if (button.mode == 'vertical') {
        button.style.transform = 'rotate(90deg)';
      } //TODO do this properly

      //pad values with this amount (to allow for line thickness)
      button.margin = {
        start: 0.15,
        end: 0.1
      };

      var video = this.video;
      //obey video states
      button.set = function (perc) {

        perc = 100 - 100 * Math.pow(1 - perc / 100, 2); //transform back from quadratic

        //add padding
        if ((perc != 100) && (perc != 0)) {
          perc = this.addPadding(perc / 100) * 100;
        }

        var sliders = button.querySelectorAll('.slider');
        for (var i = 0; i < sliders.length; i++) {
          sliders[i].setAttribute(button.mode == 'vertical' ? 'height' : 'width', perc + '%');
        }
      };
      AwmUtil.event.addListener(video, 'volumechange', function () {
        button.set(AwmVideo.player.api.muted ? 0 : (AwmVideo.player.api.volume * 100));
      }, button);

      //apply initial video state
      var initevent = AwmUtil.event.addListener(video, 'loadedmetadata', function () {
        try {
          if (('localStorage' in window) && (localStorage != null) && ('awmVolume' in localStorage)) {
            AwmVideo.player.api.volume = localStorage['awmVolume'];
          }
        } catch (e) {
        }
        AwmUtil.event.removeListener(initevent);
      });

      button.addPadding = function (actual) {
        return actual * (1 - (this.margin.start + this.margin.end)) + this.margin.start;
      };

      button.removePadding = function (padded) {
        var val = (padded - this.margin.start) / (1 - (this.margin.start + this.margin.end));
        val = Math.max(val, 0);
        val = Math.min(val, 1);
        return val;
      };

      //control video states
      button.getPos = function (e) {
        return this.addPadding(AwmUtil.getPos(this, e));
      };
      //set volume
      button.setVolume = function (e) {
        AwmVideo.player.api.muted = false;

        var val = this.removePadding(AwmUtil.getPos(this, e));

        val = 1 - Math.pow((1 - val), 0.5); //transform to quadratic range between 0 and 1
        AwmVideo.player.api.volume = val;
        try {
          localStorage['awmVolume'] = AwmVideo.player.api.volume;
        } catch (e) {
        }
      };
      AwmUtil.event.addListener(button, 'mouseup', function (e) {
        if (e.which != 1) {
          return;
        } //only respond to left mouse clicks
        button.setVolume(e);
      });

      //hovering
      var tooltip = AwmVideo.UI.buildStructure({ type: 'tooltip' });
      tooltip.style.opacity = 0;
      tooltip.triangle.setMode('bottom', 'right');
      container.style.position = 'relative';
      container.appendChild(tooltip);

      AwmUtil.event.addListener(button, 'mouseover', function () {
        tooltip.style.opacity = 1;
      });
      AwmUtil.event.addListener(button, 'mouseout', function () {
        if (!dragging) {
          tooltip.style.opacity = 0;
        }
      });
      button.moveTooltip = function (e) {
        tooltip.style.opacity = 1;
        var pos = AwmUtil.getPos(this, e);
        tooltip.setText(Math.round(this.removePadding(pos) * 100) + '%');
        tooltip.setPos({
          bottom: 46,
          right: 100 * (1 - pos) + '%'
        });
      };
      AwmUtil.event.addListener(button, 'mousemove', function (e) {
        button.moveTooltip(e);
      });

      //dragging
      var dragging = false;
      AwmUtil.event.addListener(button, 'mousedown', function (e) {
        if (e.which != 1) {
          return;
        } //only respond to left mouse clicks
        dragging = true;
        //button.set(button.getPos(e)*100);
        button.setVolume(e);
        tooltip.style.opacity = 1;

        var moveListener = AwmUtil.event.addListener(document, 'mousemove', function (e) {
          //button.set(button.getPos(e)*100);
          button.setVolume(e);
          button.moveTooltip(e);
        }, button);

        var upListener = AwmUtil.event.addListener(document, 'mouseup', function (e) {
          if (e.which != 1) {
            return;
          } //only respond to left mouse clicks
          dragging = false;

          //remove mousemove and up
          AwmUtil.event.removeListener(moveListener);
          AwmUtil.event.removeListener(upListener);

          tooltip.style.opacity = 0;

          //trigger volumechange
          if ((!e.path) || (AwmUtil.array.indexOf(e.path, button) < 0)) { //it's not already triggered by onmouseup
            button.setVolume(e);
          }
        }, button);
      });


      return container;
    },
    currentTime: function () {
      var AwmVideo = this;

      var container = document.createElement('div');
      var text = document.createTextNode('');
      container.appendChild(text);

      var formatTime = AwmUtil.format.time;
      container.set = function () {
        var v = AwmVideo.player.api.currentTime;
        text.nodeValue = formatTime(v);
      };
      container.set();

      AwmUtil.event.addListener(AwmVideo.video, 'timeupdate', function () {
        container.set();
      }, container);
      AwmUtil.event.addListener(AwmVideo.video, 'seeking', function () {
        container.set();
      }, container);

      return container;
    },
    totalTime: function () {
      var AwmVideo = this;

      var container = document.createElement('div');
      var text = document.createTextNode('');
      container.appendChild(text);

      if (AwmVideo.info.type == 'live') {
        text.nodeValue = 'live';
        container.className = 'live';
      } else {
        container.set = function (duration) {
          if (isNaN(duration) || !isFinite(duration)) {
            this.style.display = 'none';
            return;
          }
          this.style.display = '';
          text.nodeValue = AwmUtil.format.time(duration);
        };

        AwmUtil.event.addListener(AwmVideo.video, 'durationchange', function () {
          var v = AwmVideo.player.api.duration;
          container.set(v);
        }, container);
      }

      return container;
    },
    playername: function () {
      if (!this.playerName || !(this.playerName in awmplayers)) {
        return;
      }

      var container = document.createElement('span');

      container.appendChild(document.createTextNode(awmplayers[this.playerName].name));

      return container;
    },
    mimetype: function () {
      if (!this.source) {
        return;
      }

      var a = document.createElement('a');
      a.href = this.source.url;
      a.target = '_blank';
      a.title = a.href + ' (' + this.source.type + ')';

      a.appendChild(document.createTextNode(AwmUtil.format.mime2human(this.source.type)));

      return a;
    },
    logo: function (options) {
      if ('element' in options) {
        return options.element;
      }
      if ('src' in options) {
        var img = document.createElement('img');
        img.src = options.src;
        return img;
      }
    },
    settings: function () {
      var AwmVideo = this;

      var button = this.skin.icons.build('settings');

      var touchmode = (typeof document.ontouchstart != 'undefined');

      AwmUtil.event.addListener(button, 'click', function () {
        if (AwmVideo.container.hasAttribute('data-show-submenu')) {
          if (touchmode) {
            AwmVideo.container.setAttribute('data-hide-submenu', ''); //don't show even when hovering
          }
          AwmVideo.container.removeAttribute('data-show-submenu');
        } else {
          AwmVideo.container.setAttribute('data-show-submenu', '');
          AwmVideo.container.removeAttribute('data-hide-submenu');
        }
      });
      return button;
    },
    loop: function () {
      if ((!('loop' in this.player.api)) || (this.info.type == 'live')) {
        return;
      }

      var AwmVideo = this;
      var button = this.skin.icons.build('loop');

      var video = this.video;
      var api = this.player.api;
      button.set = function () {
        if (api.loop) {
          AwmUtil.class.remove(this, 'off');
        } else {
          AwmUtil.class.add(this, 'off');
        }
      };

      AwmUtil.event.addListener(button, 'click', function () {
        api.loop = !api.loop;
        this.set();
      });
      button.set();

      return button;
    },
    fullscreen: function () {
      if ((!('setSize' in this.player)) || (!this.info.hasVideo) || (this.source.type.split('/')[1] == 'audio')) {
        return;
      }

      var AwmVideo = this;

      //determine which functions to use.. 
      var requestfuncs = ['requestFullscreen', 'webkitRequestFullscreen', 'mozRequestFullScreen', 'msRequestFullscreen', 'webkitEnterFullscreen'];
      var fullscreenableElements = [function () {
        return AwmVideo.container;
      }, function () {
        return AwmVideo.video;
      }]; //if the functions are not available on the container div, try them again on the video element (for iphone)
      var funcs = false;
      main:
        for (var j in fullscreenableElements) {
          for (var i in requestfuncs) {
            if (requestfuncs[i] in fullscreenableElements[j]()) {
              funcs = {};
              funcs.request = function () {
                return funcs.fullscreenableElement()[requestfuncs[i]]();
              };

              var cancelfuncs = ['exitFullscreen', 'webkitCancelFullScreen', 'mozCancelFullScreen', 'msExitFullscreen', 'webkitExitFullscreen'];
              var elementfuncs = ['fullscreenElement', 'webkitFullscreenElement', 'mozFullScreenElement', 'msFullscreenElement', 'webkitFullscreenElement'];
              var eventname = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange', 'webkitfullscreenchange'];
              funcs.cancel = function () {
                return document[cancelfuncs[i]]();
              };
              funcs.element = function () {
                return document[elementfuncs[i]];
              };
              funcs.event = eventname[i];
              funcs.fullscreenableElement = fullscreenableElements[j];
              break main; //break to the main loop
            }
          }
        }
      if (!funcs) {
        //fake fullscreen mode!
        funcs = {
          event: 'fakefullscreenchange',
          fullscreenableElement: function () {
            return AwmVideo.container;
          },
        };
        var keydownfunc = function (e) {
          switch (e.key) {
            case 'Escape': {
              funcs.cancel();
              break;
            }
          }
        };
        funcs.request = function () {
          funcs.element = function () {
            return AwmVideo.container;
          };
          AwmUtil.event.send(funcs.event, null, document);
          document.addEventListener('keydown', keydownfunc);
          return true;
        };
        funcs.cancel = function () {
          funcs.element = function () {
            return null;
          };
          document.removeEventListener('keydown', keydownfunc);
          AwmUtil.event.send(funcs.event, null, document);
          return true;
        };
        funcs.element = function () {
          return null;
        };
      }

      var button = this.skin.icons.build('fullscreen');

      function onclick() {
        if (funcs.element()) {
          funcs.cancel();
        } else {
          funcs.request();
        }
      }

      AwmUtil.event.addListener(button, 'click', onclick);
      AwmUtil.event.addListener(AwmVideo.video, 'dblclick', onclick);
      AwmUtil.event.addListener(document, funcs.event, function () {
        if (funcs.element() == funcs.fullscreenableElement()) {
          AwmVideo.container.setAttribute('data-fullscreen', '');
        } else if (AwmVideo.container.hasAttribute('data-fullscreen')) {
          AwmVideo.container.removeAttribute('data-fullscreen');
        }
        AwmVideo.player.resizeAll();
      }, button);

      return button;
    },
    tracks: function () {

      if ((!this.info) || (!this.video)) {
        return;
      }

      var AwmVideo = this;
      var table = document.createElement('table');

      function build(tracks) {

        //empty table
        AwmUtil.empty(table);

        tracks = AwmUtil.tracks.parse(tracks);

        var selections = {};
        var checkboxes = {};

        function changeToTracks(type, value) {
          if (value) {
            AwmVideo.log('User selected ' + type + ' track with id ' + value);
          } else {
            AwmVideo.log('User selected automatic track selection for ' + type);
            AwmUtil.event.send('trackSetToAuto', type, AwmVideo.video);
          }

          if (!AwmVideo.options.setTracks) {
            AwmVideo.options.setTracks = {};
          }
          AwmVideo.options.setTracks[type] = value;
          if ((value === true) && selections[type]) {
            AwmUtil.event.send('change', null, selections[type]);
          }

          if ('setTrack' in AwmVideo.player.api) {
            return AwmVideo.player.api.setTrack(type, value);
          } else {
            //gather what tracks we should use
            var usetracks = {};
            for (var i in selections) {
              if ((i == 'subtitle') || (selections[i].value == '')) {
                continue;
              } //subtitle tracks are handled seperately
              usetracks[i] = selections[i].value;
            }
            if (value != '') {
              usetracks[type] = value;
            }
            //use setTracks
            if ('setTracks' in AwmVideo.player.api) {
              return AwmVideo.player.api.setTracks(usetracks);
            }
            //use setSource
            if ('setSource' in AwmVideo.player.api) {
              return AwmVideo.player.api.setSource(
                AwmUtil.http.url.addParam(AwmVideo.source.url, usetracks)
              );
            }
          }
        }

        //sort the tracks to ["audio","video",..,"subtitle",..etc]
        var tracktypes = AwmUtil.object.keys(tracks, function (keya, keyb) {
          function order(value) {
            switch (value) {
              case 'audio':
                return 'aaaaaaa';
              case 'video':
                return 'aaaaaab';
              default:
                return value;
            }
          }

          if (order(keya) > order(keyb)) {
            return 1;
          }
          if (order(keya) < order(keyb)) {
            return -1;
          }
          return 0;
        });
        for (var j in tracktypes) {
          const type = tracktypes[j];
          var t = tracks[type];

          if (type == 'subtitle') {
            if ((!('player' in AwmVideo)) || (!('api' in AwmVideo.player)) || (!('setSubtitle' in AwmVideo.player.api))) {
              //this player does not support adding subtitles, don't show track selection in the interface
              AwmVideo.log('Subtitle selection was disabled as this player does not support it.');
              continue;
            }

            //check if the VTT output is available
            var subtitleSource = false;
            for (var i in AwmVideo.info.source) {
              var source = AwmVideo.info.source[i];
              //this is a subtitle source, and it's the same protocol (HTTP/HTTPS) as the video source
              if ((source.type == 'html5/text/vtt') && (AwmUtil.http.url.split(source.url).protocol == AwmUtil.http.url.split(AwmVideo.source.url).protocol)) {
                subtitleSource = source.url.replace(/.srt$/, '.vtt');
                break;
              }
            }

            if (!subtitleSource) {
              //if we can't find a subtitle output, don't show track selection in the interface
              AwmVideo.log('Subtitle selection was disabled as an SRT source could not be found.');
              continue;
            }

            //also add the option to disable subtitles
            t[''] = { trackid: '', different: { none: 'None' } };

          }

          var tr = document.createElement('tr');
          tr.title = 'The current ' + type + ' track';
          table.appendChild(tr);
          var cell;
          if ('decodingIssues' in AwmVideo.skin.blueprints) { //this is dev mode
            cell = document.createElement('td');
            tr.appendChild(cell);
            if (type != 'subtitle') {
              var checkbox = document.createElement('input');
              checkbox.setAttribute('type', 'checkbox');
              checkbox.setAttribute('checked', '');
              checkbox.setAttribute('title', 'Whether or not to play ' + type);
              checkbox.trackType = type;
              cell.appendChild(checkbox);
              checkboxes[type] = checkbox;

              if (AwmVideo.options.setTracks && (AwmVideo.options.setTracks[type])) {
                if (AwmVideo.options.setTracks[type] == 'none') {
                  checkbox.checked = false;
                } else {
                  checkbox.checked = true;
                }
              }

              AwmUtil.event.addListener(checkbox, 'change', function () {
                //make sure at least one checkbox is checked
                var n = 0;
                for (var i in checkboxes) {
                  if (checkboxes[i].checked) {
                    n++;
                  }
                }
                if (n == 0) {
                  for (var i in checkboxes) {
                    if (i == this.trackType) {
                      continue;
                    }
                    if (!checkboxes[i].checked) {
                      checkboxes[i].checked = true;
                      changeToTracks(i, true);
                      break;
                    }
                  }
                }

                var value = 'none';
                if (this.checked) {
                  if (this.trackType in selections) {
                    value = selections[this.trackType].value;
                  } else {
                    value = 'auto';
                  }
                } else {
                  value = 'none';
                }
                changeToTracks(this.trackType, (this.checked ? value : 'none'));
              });

              AwmUtil.event.addListener(AwmVideo.video, 'playerUpdate_trackChanged', function (e) {

                if (e.message.type != type) {
                  return;
                }

                if (e.message.value == 'none') {
                  this.checked = false;
                } else {
                  this.checked = true;
                }

              }, select);
            }
          }

          var header = document.createElement('td');
          tr.appendChild(header);
          header.appendChild(document.createTextNode(AwmUtil.format.ucFirst(type) + ':'));
          cell = document.createElement('td');
          tr.appendChild(cell);
          var trackkeys = AwmUtil.object.keys(t);

          //var determine the display info for the tracks
          function orderValues(trackinfoobj) {
            var order = {
              trackid: 0,
              language: 1,
              width: 2,
              bps: 3,
              fpks: 4,
              channels: 5,
              codec: 6,
              rate: 7
            };
            return AwmUtil.object.values(trackinfoobj, function (keya, keyb) {
              if (order[keya] > order[keyb]) {
                return 1;
              }
              if (order[keya] < order[keyb]) {
                return -1;
              }
              return 0;
            });
          }

          //there is more than one track of this type, and the player supports switching tracks
          if ((trackkeys.length > 1) && ('player' in AwmVideo) && ('api' in AwmVideo.player) && (('setTrack' in AwmVideo.player.api) || ('setTracks' in AwmVideo.player.api) || ('setSource' in AwmVideo.player.api))) {
            //show a select box
            const select = document.createElement('select');
            select.title = 'Select another ' + type + ' track';
            selections[type] = select;
            select.trackType = type;
            cell.appendChild(select);
            var option;
            if (type != 'subtitle') {
              option = document.createElement('option');
              select.appendChild(option);
              option.value = '';
              option.appendChild(document.createTextNode('Automatic'));
            }

            //display properties that are the same for all tracks
            var same = orderValues(t[AwmUtil.object.keys(t)[0]].same);
            if (same.length) {
              var span = document.createElement('span');
              span.className = 'awmvideo-description';
              cell.appendChild(span);
              cell.appendChild(document.createTextNode(same.join(' ')));
            }


            //add options to the select
            function n(str) {
              if (str == '') {
                return -1;
              }
              return Number(str);
            }

            var options = AwmUtil.object.keys(t, function (a, b) {
              return n(a) - n(b);
            }); //sort them
            for (var i in options) {
              var track = t[options[i]];
              option = document.createElement('option');
              select.appendChild(option);
              option.value = ('idx' in track ? track.idx : track.trackid);
              if (AwmUtil.object.keys(track.different).length) {
                option.appendChild(document.createTextNode(orderValues(track.different).join(' ')));
              } else {
                //all the tracks are the same as far as the metadata is concerned, just show a track number
                option.appendChild(document.createTextNode('Track ' + (Number(i) + 1)));
              }
            }

            AwmUtil.event.addListener(AwmVideo.video, 'playerUpdate_trackChanged', function (e) {

              if ((e.message.type != type) || (e.message.trackid == 'none')) {
                return;
              }
              select.value = e.message.trackid;
              AwmVideo.log('Player selected ' + type + ' track with id ' + e.message.trackid);

            }, select);

            if (type == 'subtitle') {
              AwmUtil.event.addListener(select, 'change', function () {
                try {
                  localStorage['awmSubtitleLanguage'] = t[this.value].lang;
                } catch (e) {
                }

                if (this.value != '') {
                  //gather metadata for this subtitle track here
                  var trackinfo = AwmUtil.object.extend({}, t[this.value]);
                  trackinfo.label = orderValues(trackinfo.describe).join(' ');

                  trackinfo.src = AwmUtil.http.url.addParam(subtitleSource, { track: this.value });
                  AwmVideo.player.api.setSubtitle(trackinfo);
                } else {
                  AwmVideo.player.api.setSubtitle();
                }
              });
              try {
                //load last used language if available
                if (('localStorage' in window) && (localStorage != null) && ('awmSubtitleLanguage' in localStorage)) {
                  for (var i in t) {
                    if (t[i].lang == localStorage['awmSubtitleLanguage']) {
                      select.value = i;

                      //trigger onchange
                      var e = document.createEvent('Event');
                      e.initEvent('change');
                      select.dispatchEvent(e);
                      break;
                    }
                  }
                }
              } catch (e) {
              }
            } else {
              AwmUtil.event.addListener(select, 'change', function () {
                if (this.trackType in checkboxes) { //this is dev mode
                  checkboxes[this.trackType].checked = true;
                }

                if (!changeToTracks(this.trackType, this.value)) {
                  //trackchange failed, reset select to old value
                }

              });

              //set to the track that plays by default
              /*
              if (AwmVideo.info.type == "live") {
                //for live, the default track is the highest index
                select.value = AwmUtil.object.keys(t).pop();
              }
              else {
                //for vod, the default track is the lowest index
                select.value = AwmUtil.object.keys(t).shift();
              }
              */

            }
          } else {
            //show as text
            var span = document.createElement('span');
            span.className = 'awmvideo-description';
            cell.appendChild(span);
            span.appendChild(document.createTextNode(orderValues(t[trackkeys[0]].same).join(' ')));
          }
        }

      }

      build(this.info.meta.tracks);
      AwmUtil.event.addListener(AwmVideo.video, 'metaUpdate_tracks', function (e) {

        //reconstruct track selection interface
        build(e.message.meta.tracks);

      }, table);

      return table;
    },
    text: function (options) {
      var container = document.createElement('span');

      container.appendChild(document.createTextNode(options.text));

      return container;
    },
    placeholder: function () {
      var placeholder = document.createElement('div');
      var size = this.calcSize();
      placeholder.style.width = size.width + 'px';
      placeholder.style.height = size.height + 'px';
      if (this.options.poster) placeholder.style.background = 'url(\'' + this.options.poster + '\') no-repeat 50%/contain';

      return placeholder;
    },
    timeout: function (options) {
      if (!'function' in options) {
        return;
      }
      var delay = ('delay' in options ? options.delay : 5);

      var icon = this.skin.icons.build('timeout', false, { delay: delay });

      icon.timeout = this.timers.start(function () {
        options.function();
      }, delay * 1e3);

      return icon;
    },
    polling: function () {
      var div = document.createElement('div');
      var icon = this.skin.icons.build('loading');
      div.appendChild(icon);
      return div;
    },
    loading: function () {
      var AwmVideo = this;
      var icon = this.skin.icons.build('loading', 50);

      if (('player' in AwmVideo) && (AwmVideo.player.api)) {
        var timer = false;

        function addIcon(e) {
          AwmVideo.container.setAttribute('data-loading', e.type);
          checkIfOk();
        }

        function removeIcon() {
          AwmVideo.container.removeAttribute('data-loading');
          if (timer) {
            AwmVideo.timers.stop(timer);
          }
          timer = false;
        }

        function checkIfOk() {
          if (!timer) {
            //if everything is playing fine, remove the icon
            timer = AwmVideo.timers.start(function () {
              timer = false;
              if ((AwmVideo.monitor.vars) && (AwmVideo.monitor.vars.score >= 0.999)) { //it's playing just fine
                removeIcon();
              } else {
                checkIfOk();
              }
            }, 1e3);
          }
        }

        //add loading icon
        var events = ['waiting', 'seeking', 'stalled'];
        for (var i in events) {
          AwmUtil.event.addListener(AwmVideo.video, events[i], function (e) {
            if ((!this.paused) && ('container' in AwmVideo)) {
              addIcon(e);
            }
          }, icon);
        }
        //remove loading icon
        var events = ['seeked', 'playing', 'canplay', 'paused', 'ended'];
        for (var i in events) {
          AwmUtil.event.addListener(AwmVideo.video, events[i], function () {
            if ('container' in AwmVideo) {
              removeIcon();
            }
          }, icon);
          AwmUtil.event.addListener(AwmVideo.video, 'progress', function () {
            if (('container' in AwmVideo) && ('monitor' in AwmVideo) && ('vars' in AwmVideo.monitor) && ('score' in AwmVideo.monitor.vars) && (AwmVideo.monitor.vars.score > 0.99)) {
              removeIcon();
            }
          }, icon);
        }

      }

      return icon;
    },
    error: function () {
      var AwmVideo = this;
      var container = document.createElement('div');
      container.message = function (message, details, options) {
        AwmUtil.empty(this);
        var message_container = document.createElement('div');
        message_container.className = 'message';
        this.appendChild(message_container);

        if (!options.polling && !options.passive && !options.hideTitle) {
          var header = document.createElement('h3');
          message_container.appendChild(header);
          header.appendChild(document.createTextNode('The player has encountered a problem'));
        }

        var p = document.createElement('p');
        message_container.appendChild(p);
        message_container.update = function (message) {
          AwmUtil.empty(p);
          //p.appendChild(document.createTextNode(message));
          p.innerHTML = message; //allow custom html messages (configured in MI/HTTP/nostreamtext)
        };
        if (message) {
          if (AwmVideo.info.on_error) {
            message = AwmVideo.info.on_error.replace(/\<error>/, message);
          }

          message_container.update(message);

          var d = document.createElement('p');
          d.className = 'details awmvideo-description';
          message_container.appendChild(d);

          if (details) {
            d.appendChild(document.createTextNode(details));
          } else if ('decodingIssues' in AwmVideo.skin.blueprints) { //dev mode
            if (('player' in AwmVideo) && ('api' in AwmVideo.player) && (AwmVideo.video)) {
              details = [];
              if (typeof AwmVideo.state != 'undefined') {
                details.push(['Stream state:', AwmVideo.state]);
              }
              if (typeof AwmVideo.player.api.currentTime != 'undefined') {
                details.push(['Current video time:', AwmUtil.format.time(AwmVideo.player.api.currentTime)]);
              }
              if (('video' in AwmVideo) && ('getVideoPlaybackQuality' in AwmVideo.video)) {
                var data = AwmVideo.video.getVideoPlaybackQuality();
                if (('droppedVideoFrames' in data) && ('totalVideoFrames' in data) && (data.totalVideoFrames)) {
                  details.push(['Frames dropped/total:', AwmUtil.format.number(data.droppedVideoFrames) + '/' + AwmUtil.format.number(data.totalVideoFrames)]);
                }
                if (('corruptedVideoFrames' in data) && (data.corruptedVideoFrames)) {
                  details.push(['Corrupted frames:', AwmUtil.format.number(data.corruptedVideoFrames)]);
                }
              }
              var networkstates = {
                0: ['NETWORK EMPTY:', 'not yet initialized'],
                1: ['NETWORK IDLE:', 'resource selected, but not in use'],
                2: ['NETWORK LOADING:', 'data is being downloaded'],
                3: ['NETWORK NO SOURCE:', 'could not locate source']
              };
              details.push(networkstates[AwmVideo.video.networkState]);
              var readystates = {
                0: ['HAVE NOTHING:', 'no information about ready state'],
                1: ['HAVE METADATA:', 'metadata has been loaded'],
                2: ['HAVE CURRENT DATA:', 'data for the current playback position is available, but not for the next frame'],
                3: ['HAVE FUTURE DATA:', 'data for current and next frame is available'],
                4: ['HAVE ENOUGH DATA:', 'can start playing']
              };
              details.push(readystates[AwmVideo.video.readyState]);

              if (!options.passive) {
                var table = document.createElement('table');
                for (var i in details) {
                  var tr = document.createElement('tr');
                  table.appendChild(tr);
                  for (var j in details[i]) {
                    var td = document.createElement('td');
                    tr.appendChild(td);
                    td.appendChild(document.createTextNode(details[i][j]));
                  }
                }
                d.appendChild(table);
              }
            }
            var c = document.createElement('div');
            c.className = 'awmvideo-container awmvideo-column';
            c.style.textAlign = 'left';
            c.style.marginBottom = '1em';
            message_container.appendChild(c);
            var s = AwmVideo.UI.buildStructure({ type: 'forcePlayer' });
            if (s) {
              c.appendChild(s);
            }
            s = AwmVideo.UI.buildStructure({ type: 'forceType' });
            if (s) {
              c.appendChild(s);
            }
          }

        }

        return message_container;
      };

      var showingError = false;
      var since = false;
      var message_global;
      var ignoreThese = {};

      //add control functions to overall AwmVideo object
      this.showError = function (message, options) {
        if (!options) {
          options = {
            softReload: !!(AwmVideo.player && AwmVideo.player.api && AwmVideo.player.api.load),
            reload: true,
            nextCombo: !!AwmVideo.info,
            polling: false,
            passive: false
          };
        }


        var identifyer = (options.type ? options.type : message);
        if (identifyer in ignoreThese) {
          return;
        }

        if (options.reload === true) {
          if ((AwmVideo.options.reloadDelay) && (!isNaN(Number(AwmVideo.options.reloadDelay)))) {
            options.reload = Number(AwmVideo.options.reloadDelay);
          } else {
            options.reload = 10;
          }
        }
        if (options.passive) {
          if (showingError === true) {
            return;
          }
          if (showingError) {
            //only update the text, not the buttons or their countdowns
            message_global.update(message);
            since = (new Date()).getTime();
            return;
          }
          container.setAttribute('data-passive', '');
        } else {
          container.removeAttribute('data-passive');
        }
        if (showingError) {
          container.clear();
        } //stop any countdowns still running

        showingError = (options.passive ? 'passive' : true);
        since = (new Date()).getTime();


        var event = this.log(message, 'error');
        var message_container = container.message(message, false, options);
        message_global = message_container;

        var button_container = document.createElement('div');
        button_container.className = 'awmvideo-buttoncontainer';
        message_container.appendChild(button_container);

        AwmUtil.empty(button_container);
        var obj;
        if (options.softReload) {
          obj = {
            type: 'button',
            label: 'Reload video',
            onclick: function () {
              AwmVideo.player.api.load();
            }
          };
          if (!isNaN(options.softReload + '')) {
            obj.delay = options.softReload;
          }
          button_container.appendChild(AwmVideo.UI.buildStructure(obj));
        }

        if (options.reload) {
          obj = {
            type: 'button',
            label: 'Reload player',
            onclick: function () {
              AwmVideo.reload('Reloading because reload button was clicked.');
            }
          };
          if (!isNaN(options.reload + '')) {
            obj.delay = options.reload;
          }
          button_container.appendChild(AwmVideo.UI.buildStructure(obj));
        }
        if (options.nextCombo) {
          obj = {
            type: 'button',
            label: 'Next source',
            onclick: function () {
              AwmVideo.nextCombo();
            }
          };
          if (!isNaN(options.nextCombo + '')) {
            obj.delay = options.nextCombo;
          }
          button_container.appendChild(AwmVideo.UI.buildStructure(obj));
        }
        if (options.ignore) {
          obj = {
            type: 'button',
            label: 'Ignore',
            onclick: function () {
              this.clearError();
              ignoreThese[identifyer] = true;
              //stop showing this error
            }
          };
          if (!isNaN(options.ignore + '')) {
            obj.delay = options.ignore;
          }
          button_container.appendChild(AwmVideo.UI.buildStructure(obj));
        }
        if (options.polling) {
          button_container.appendChild(AwmVideo.UI.buildStructure({ type: 'polling' }));
        }

        AwmUtil.class.add(container, 'show');
        if ('container' in AwmVideo) {
          AwmVideo.container.removeAttribute('data-loading');
        }

        if (event.defaultPrevented) {
          container.clear();
        }
      };
      container.clear = function () {
        var countdowns = container.querySelectorAll('svg.icon.timeout');
        for (var i = 0; i < countdowns.length; i++) {
          AwmVideo.timers.stop(countdowns[i].timeout);
        }

        AwmUtil.empty(container);
        AwmUtil.class.remove(container, 'show');

        showingError = false;
      };
      this.clearError = container.clear;

      //listener to clear error window
      if ('video' in AwmVideo) {
        var events = ['timeupdate', 'playing', 'canplay'];//,"progress"];
        for (var i in events) {
          AwmUtil.event.addListener(AwmVideo.video, events[i], function (e) {
            if (!showingError) {
              return;
            }
            if (e.type == 'timeupdate') {
              if (AwmVideo.player.api.currentTime == 0) {
                return;
              }
              if (((new Date()).getTime() - since) < 2e3) {
                return;
              }
            }
            AwmVideo.log('Removing error window because of ' + e.type + ' event');
            container.clear();
          }, container);
        }
      }

      return container;
    },
    tooltip: function () {
      var container = document.createElement('div');

      var textNode = document.createTextNode('');
      container.appendChild(textNode);
      container.setText = function (text) {
        textNode.nodeValue = text;
      };

      var triangle = document.createElement('div');
      container.triangle = triangle;
      triangle.className = 'triangle';
      container.appendChild(triangle);
      triangle.setMode = function (primary, secondary) {
        if (!primary) {
          primary = 'bottom';
        }
        if (!secondary) {
          secondary = 'left';
        }

        //reset styles
        var sides = ['bottom', 'top', 'right', 'left'];
        for (var i in sides) {
          this.style[sides[i]] = '';             //bottom
          var cap = AwmUtil.format.ucFirst(sides[i]);
          this.style['border' + cap] = '';         //borderBottom
          this.style['border' + cap + 'Color'] = ''; //borderBottomColor
        }

        var opposite = {
          top: 'bottom',
          bottom: 'top',
          left: 'right',
          right: 'left'
        };

        //set styles
        this.style[primary] = '-10px';                                                 //bottom
        this.style['border' + AwmUtil.format.ucFirst(opposite[primary])] = 'none';      //borderTop
        this.style['border' + AwmUtil.format.ucFirst(primary) + 'Color'] = 'transparent'; //borderBottomColor
        this.style[secondary] = 0;                                                     //left
        this.style['border' + AwmUtil.format.ucFirst(opposite[secondary])] = 'none';    //borderRight
      };

      container.setPos = function (pos) {

        //also apply the "other" values, to reset if direction mode is switched
        var set = {
          left: 'auto',
          right: 'auto',
          top: 'auto',
          bottom: 'auto'
        };
        AwmUtil.object.extend(set, pos);

        for (var i in set) {
          if (!isNaN(set[i])) {
            set[i] += 'px';
          } //add px if the value is a number
          this.style[i] = set[i];
        }
      };

      return container;
    },
    button: function (options) { //label,onclick,timeout){
      var button = document.createElement('button');
      var AwmVideo = this;

      if (options.onclick) {
        AwmUtil.event.addListener(button, 'click', function () {
          options.onclick.call(AwmVideo, arguments);
        });

        if (options.delay) {
          var countdown = this.UI.buildStructure({
            type: 'timeout',
            delay: options.delay,
            function: options.onclick
          });
          if (countdown) {
            button.appendChild(countdown);
          }
        }
      }

      button.appendChild(document.createTextNode(options.label));

      return button;
    },
    videobackground: function (options) {
      /* options.alwaysDisplay : if true, always draw the video on the canvas */
      /* options.delay         : delay of the draw timeout in seconds */
      if (!options) {
        options = {};
      }
      if (!options.delay) {
        options.delay = 5;
      }

      var ele = document.createElement('div');
      var AwmVideo = this;

      var canvasses = [];
      for (var n = 0; n < 2; n++) {
        var c = document.createElement('canvas');
        c._context = c.getContext('2d');
        ele.appendChild(c);
        canvasses.push(c);
      }

      var index = 0;
      var drawing = false;

      function draw() {
        //only draw if the element is visible, don't waste cpu
        if (options.alwaysDisplay || (AwmVideo.video.videoWidth / AwmVideo.video.videoHeight != ele.clientWidth / ele.clientHeight)) {

          canvasses[index].removeAttribute('data-front'); //put last one behind again
          //console.log(new Date().toLocaleTimeString(),"draw");

          index++;
          if (index >= canvasses.length) {
            index = 0;
          }

          var c = canvasses[index];
          var ctx = c._context;

          c.width = AwmVideo.video.videoWidth;
          c.height = AwmVideo.video.videoHeight;
          ctx.drawImage(AwmVideo.video, 0, 0);
          c.setAttribute('data-front', '');
        }

        if (!AwmVideo.player.api.paused) {
          AwmVideo.timers.start(function () {
            draw();
          }, options.delay * 1e3);
        } else {
          drawing = false;
        }

      }

      AwmUtil.event.addListener(AwmVideo.video, 'playing', function () {
        if (!drawing) {
          draw();
          drawing = true;
        }
      });

      return ele;
    }
  },
  colors: {
    fill: '#fff',
    semiFill: 'rgba(255,255,255,0.5)',
    stroke: '#fff',
    strokeWidth: 1.5,
    background: 'rgba(0,0,0,0.8)',
    progressBackground: '#333',
    accent: '#0f0'
  }
};

AwmSkins.dev = {
  structure: AwmUtil.object.extend({}, AwmSkins['default'].structure, true),
  blueprints: {
    timeout: function () { //don't use countdowns on buttons
      //don't use countdowns on buttons unless AwmVideo.options.reloadDelay is set
      if (this.options.reloadDelay !== false) {
        return AwmSkins.default.blueprints.timeout.apply(this, arguments);
      }
      return false;
    },
    log: function () {
      var container = document.createElement('div');
      container.appendChild(document.createTextNode('Logs'));
      var logsc = document.createElement('div');//scroll this
      logsc.className = 'logs';
      container.appendChild(logsc);
      var logs = document.createElement('table');
      logsc.appendChild(logs);

      var AwmVideo = this;
      var lastmessage = { message: false };
      var count = false;
      var scroll = true;

      function addMessage(time, message, data) {
        if (!data) {
          data = {};
        }

        if (lastmessage.message == message) {
          count++;

          lastmessage.counter.nodeValue = count;
          if ((count == 2) && (lastmessage.counter.parentElement)) {
            lastmessage.counter.parentElement.style.display = '';
          }

          return;
        }

        count = 1;

        var entry = document.createElement('tr');
        entry.className = 'entry';
        if ((data.type) && (data.type != 'log')) {
          AwmUtil.class.add(entry, 'type-' + data.type);
          message = AwmUtil.format.ucFirst(data.type) + ': ' + message;
        }
        logs.appendChild(entry);

        var timestamp = document.createElement('td');
        timestamp.className = 'timestamp';
        entry.appendChild(timestamp);
        var stamp = time.toLocaleTimeString(); //get current time in local format
        //add miliseconds
        var t = stamp.split(' ');
        t[0] += '.' + ('00' + time.getMilliseconds()).slice(-3);
        //t = t.join(" ");
        timestamp.appendChild(document.createTextNode(t[0]));
        if ('currentTime' in data) {
          timestamp.title = 'Video playback time: ' + AwmUtil.format.time(data.currentTime, { ms: true });
        }

        var td = document.createElement('td');
        entry.appendChild(td);
        var msg = document.createElement('span');
        msg.className = 'message';
        td.appendChild(msg);
        msg.appendChild(document.createTextNode(message));

        var counter = document.createElement('span');
        counter.style.display = 'none';
        counter.className = 'counter';
        td.appendChild(counter);
        var countnode = document.createTextNode(count);
        counter.appendChild(countnode);

        if (scroll) {
          logsc.scrollTop = logsc.scrollHeight;
        }

        lastmessage = { message: message, counter: countnode };
      }

      AwmUtil.event.addListener(logsc, 'scroll', function () {
        //console.log(logsc.scrollTop + logsc.clientHeight,logsc.scrollHeight);
        if (logsc.scrollTop + logsc.clientHeight >= logsc.scrollHeight - 5) {
          scroll = true;
        } else {
          scroll = false;
        }
        //console.log(scroll);
      });

      //add previously generated log messages
      for (var i in AwmVideo.logs) {
        addMessage(AwmVideo.logs[i].time, AwmVideo.logs[i].message, AwmVideo.logs[i].data);
      }

      AwmUtil.event.addListener(AwmVideo.options.target, 'log', function (e) {
        if (!e.message) {
          return;
        }
        var data = {};
        if (AwmVideo.player && AwmVideo.player.api && ('currentTime' in AwmVideo.player.api)) {
          data.currentTime = AwmVideo.player.api.currentTime;
        }
        addMessage(new Date(), e.message, data);
      }, container);
      AwmUtil.event.addListener(AwmVideo.options.target, 'error', function (e) {
        if (!e.message) {
          return;
        }
        var data = { type: 'error' };
        if (AwmVideo.player && AwmVideo.player.api && ('currentTime' in AwmVideo.player.api)) {
          data.currentTime = AwmVideo.player.api.currentTime;
        }
        addMessage(new Date(), e.message, data);
      }, container);

      return container;
    },
    decodingIssues: function () {
      if (!this.player) {
        return;
      }

      var AwmVideo = this;
      var container = document.createElement('div');

      function buildItem(options) {
        var label = document.createElement('label');
        container.appendChild(label);
        label.style.display = 'none';

        var text = document.createElement('span');
        label.appendChild(text);
        text.appendChild(document.createTextNode(options.name + ':'));
        text.className = 'awmvideo-description';

        var valuec = document.createElement('span');
        label.appendChild(valuec);
        var value = document.createTextNode((options.value ? options.value : ''));
        valuec.appendChild(value);
        var ele = document.createElement('span');
        valuec.appendChild(ele);

        label.set = function (val) {
          if (val !== 0) {
            this.style.display = '';
          }
          if (typeof val == 'object') {
            if (val instanceof Promise) {
              val.then(function (val) {
                label.set(val);
              }, function () {
              });
              return;
            }

            if ('val' in val) {
              value.nodeValue = val.val;
              valuec.className = 'value';
            }
            //is there a graph already?
            var graph;
            if (ele.children.length) {
              graph = ele.children[0];
              return graph.addData(val);
            } else {
              //create a graph
              graph = AwmUtil.createGraph({ x: [val.x], y: [val.y] }, val.options);

              //it's (probably) a DOM element, insert it
              ele.style.display = '';
              AwmUtil.empty(ele);
              return ele.appendChild(graph);
            }
          }
          return value.nodeValue = val;
        };

        container.appendChild(label);
        updates.push(function () {
          var result = options.function();
          label.set(result);
        });
      }

      if (AwmVideo.player.api) {
        var videovalues = {
          'Playback score': function () {
            if ('monitor' in AwmVideo) {
              if (('vars' in AwmVideo.monitor) && ('score' in AwmVideo.monitor.vars)) {
                if (AwmVideo.monitor.vars.values.length) {
                  var last = AwmVideo.monitor.vars.values[AwmVideo.monitor.vars.values.length - 1];
                  if ('score' in last) {
                    return {
                      x: last.clock,
                      y: Math.min(1, Math.max(0, last.score)),
                      options: {
                        y: {
                          min: 0,
                          max: 1
                        },
                        x: {
                          count: 10
                        }
                      },
                      val: Math.round(Math.min(1, Math.max(0, AwmVideo.monitor.vars.score)) * 100) + '%'
                    };
                  }
                }
              }
              return 0;
            }
          },
          'Corrupted frames': function () {
            if ((AwmVideo.player.api) && ('getVideoPlaybackQuality' in AwmVideo.player.api)) {
              var r = AwmVideo.player.api.getVideoPlaybackQuality();
              if (r) {
                if (r.corruptedVideoFrames) {
                  return {
                    val: AwmUtil.format.number(r.corruptedVideoFrames),
                    x: (new Date()).getTime() * 1e-3,
                    y: r.corruptedVideoFrames,
                    options: {
                      x: { count: 10 }
                    }
                  };
                }
                return 0;
              }
            }
          },
          'Dropped frames': function () {
            if ((AwmVideo.player.api) && ('getVideoPlaybackQuality' in AwmVideo.player.api)) {
              var r = AwmVideo.player.api.getVideoPlaybackQuality();
              if (r) {
                if (r.droppedVideoFrames) {
                  return AwmUtil.format.number(r.droppedVideoFrames);
                  /* show a graph: return {
                    val: AwmUtil.format.number(r.droppedVideoFrames),
                    x: (new Date()).getTime()*1e-3,
                    y: r.droppedVideoFrames,
                    options: {
                      x: { count: 10 },
                      differentiate: true,
                      reverseGradient: true
                    }
                  };*/
                }
                return 0;
              }
            }
          },
          'Total frames': function () {
            if ((AwmVideo.player.api) && ('getVideoPlaybackQuality' in AwmVideo.player.api)) {
              var r = AwmVideo.player.api.getVideoPlaybackQuality();
              if (r) {
                return AwmUtil.format.number(r.totalVideoFrames);
              }
            }
          },
          'Decoded audio': function () {
            if (AwmVideo.player.api) {
              return AwmUtil.format.bytes(AwmVideo.player.api.webkitAudioDecodedByteCount);
            }
          },
          'Decoded video': function () {
            if (AwmVideo.player.api) {
              return AwmUtil.format.bytes(AwmVideo.player.api.webkitVideoDecodedByteCount);
            }
          },
          'Negative acknowledgements': function () {
            if (AwmVideo.player.api) {
              return AwmUtil.format.number(AwmVideo.player.api.nackCount);
            }
          },
          'Picture losses': function () {
            return AwmUtil.format.number(AwmVideo.player.api.pliCount);
          },
          'Packets lost': function () {
            return AwmUtil.format.number(AwmVideo.player.api.packetsLost);
          },
          'Packets received': function () {
            return AwmUtil.format.number(AwmVideo.player.api.packetsReceived);
          },
          'Bytes received': function () {
            if (AwmVideo.player.api) {
              return AwmUtil.format.bytes(AwmVideo.player.api.bytesReceived);
            }
          },
          'Local latency [ms]': function () {
            if ((AwmVideo.player.api) && ('getLatency' in AwmVideo.player.api)) {
              var p = AwmVideo.player.api.getLatency();
              if (p) {
                return new Promise(function (resolve, reject) {
                  p.then(function (result) {
                    var r = [];
                    for (var i in result) {
                      if (result[i]) {
                        r.push(i[0] + ':' + Math.round(result[i] * 1e3));
                      }
                    }
                    if (r.length) {
                      resolve(r.join(' '));
                    } else {
                      resolve();
                    }
                  }, reject);
                });
              }
              return new Promise(function (resolve) {
                resolve();
              }, function () {
              });
            }
          },
          'Current bitrate': function () {
            if (AwmVideo.player.monitor && ('currentBps' in AwmVideo.player.monitor)) {
              var out = AwmUtil.format.bits(AwmVideo.player.monitor.currentBps);
              return out ? out + 'ps' : out;
            }
          }
        };
        var updates = [];
        for (var i in videovalues) {
          if (typeof videovalues[i]() == 'undefined') {
            continue;
          }
          buildItem({
            name: i,
            function: videovalues[i]
          });
        }
        container.update = function () {
          for (var i in updates) {
            updates[i]();
          }
          AwmVideo.timers.start(function () {
            container.update();
          }, 1e3);
        };
        container.update();
      }

      return container;
    },
    forcePlayer: function () {
      var container = document.createElement('label');
      container.title = 'Reload AwmVideo and use the selected player';
      var AwmVideo = this;

      var s = document.createElement('span');
      container.appendChild(s);
      s.appendChild(document.createTextNode('Force player: '));

      var select = document.createElement('select');
      container.appendChild(select);
      var option = document.createElement('option');
      select.appendChild(option);
      option.value = '';
      option.appendChild(document.createTextNode('Automatic'));
      for (var i in awmplayers) {
        option = document.createElement('option');
        select.appendChild(option);
        option.value = i;
        option.appendChild(document.createTextNode(awmplayers[i].name));

      }

      if (this.options.forcePlayer) {
        select.value = this.options.forcePlayer;
      }

      AwmUtil.event.addListener(select, 'change', function () {
        AwmVideo.options.forcePlayer = (this.value == '' ? false : this.value);
        if (AwmVideo.options.forcePlayer != AwmVideo.playerName) { //only reload if there is a change
          AwmVideo.reload('Reloading to force player.');
        }
      });

      return container;
    },
    forceType: function () {
      if (!this.info) {
        return;
      }

      var container = document.createElement('label');
      container.title = 'Reload AwmVideo and use the selected protocol';
      var AwmVideo = this;

      var s = document.createElement('span');
      container.appendChild(s);
      s.appendChild(document.createTextNode('Force protocol: '));

      var select = document.createElement('select');
      container.appendChild(select);
      var option = document.createElement('option');
      select.appendChild(option);
      option.value = '';
      option.appendChild(document.createTextNode('Automatic'));
      var sofar = {};
      for (var i in AwmVideo.info.source) {
        var source = AwmVideo.info.source[i];

        //skip doubles
        if (source.type in sofar) {
          continue;
        }
        sofar[source.type] = 1;

        option = document.createElement('option');
        select.appendChild(option);
        option.value = source.type;
        option.appendChild(document.createTextNode(AwmUtil.format.mime2human(source.type)));
      }

      if (this.options.forceType) {
        select.value = this.options.forceType;
      }

      AwmUtil.event.addListener(select, 'change', function () {
        AwmVideo.options.forceType = (this.value == '' ? false : this.value);
        if ((!AwmVideo.source) || (AwmVideo.options.forceType != AwmVideo.source.type)) { //only reload if there is a change
          AwmVideo.reload('Reloading to force new type.');
        }
      });

      return container;
    },
    forceSource: function () {
      var container = document.createElement('label');
      container.title = 'Reload AwmVideo and use the selected source';
      var AwmVideo = this;

      var s = document.createElement('span');
      container.appendChild(s);
      s.appendChild(document.createTextNode('Force source: '));

      var select = document.createElement('select');
      container.appendChild(select);
      var option = document.createElement('option');
      select.appendChild(option);
      option.value = '';
      option.appendChild(document.createTextNode('Automatic'));
      for (var i in AwmVideo.info.source) {
        var source = AwmVideo.info.source[i];
        option = document.createElement('option');
        select.appendChild(option);
        option.value = i;
        option.appendChild(document.createTextNode(source.url + ' (' + AwmUtil.format.mime2human(source.type) + ')'));
      }

      if (this.options.forceSource) {
        select.value = this.options.forceSource;
      }

      AwmUtil.event.addListener(select, 'change', function () {
        AwmVideo.options.forceSource = (this.value == '' ? false : this.value);
        if (AwmVideo.options.forceSource != AwmVideo.source.index) { //only reload if there is a change
          AwmVideo.reload('Reloading to force new source.');
        }
      });

      return container;
    }
  }
};

//AwmSkins.dev.css = AwmUtil.object.extend(AwmSkins["default"].css);
AwmSkins.dev.css = { skin: awmhost + '/skins/dev.css' };
//prepend dev tools to settings window
AwmSkins.dev.structure.submenu = AwmUtil.object.extend({}, AwmSkins['default'].structure.submenu, true);
AwmSkins.dev.structure.submenu.type = 'draggable';
AwmSkins.dev.structure.submenu.style.width = '25em';
AwmSkins.dev.structure.submenu.children.unshift({
  type: 'container',
  style: { flexShrink: 1 },
  classes: ['awmvideo-column'],
  children: [
    {
      if: function () {
        return (this.playerName && this.source);
      },
      then: {
        type: 'container',
        classes: ['awmvideo-description'],
        style: { display: 'block' },
        children: [
          { type: 'playername', style: { display: 'inline' } },
          { type: 'text', text: 'is playing', style: { margin: '0 0.2em' } },
          { type: 'mimetype' }
        ]
      }
    },
    { type: 'log' },
    { type: 'decodingIssues' },
    {
      type: 'container',
      classes: ['awmvideo-column', 'awmvideo-devcontrols'],
      style: { 'font-size': '0.9em' },
      children: [
        {
          type: 'text',
          text: 'Player control'
        }, {
          type: 'container',
          classes: ['awmvideo-devbuttons'],
          style: { 'flex-wrap': 'wrap' },
          children: [
            {
              type: 'button',
              title: 'Build AwmVideo again',
              label: 'AwmVideo.reload();',
              onclick: function () {
                this.reload('Dev-reload button clicked.');
              }
            }, {
              type: 'button',
              title: 'Switch to the next available player and source combination',
              label: 'AwmVideo.nextCombo();',
              onclick: function () {
                this.nextCombo();
              }
            }
          ]
        },
        { type: 'forcePlayer' },
        { type: 'forceType' }//,
        //{type:"forceSource"}
      ]
    }
  ]
});

// a skin has a structure
// a skin has formatting rules
// a skin has blueprints that build element types
function AwmSkin(AwmVideo) {
  AwmVideo.skin = this;

  this.applySkinOptions = function (skinOptions) {
    if ((typeof skinOptions == 'string') && (skinOptions in AwmSkins)) {
      skinOptions = AwmUtil.object.extend({}, AwmSkins[skinOptions], true);
    }

    var skinParent;
    if (('inherit' in skinOptions) && (skinOptions.inherit) && (skinOptions.inherit in AwmSkins)) {
      skinParent = this.applySkinOptions(skinOptions.inherit);
    } else {
      skinParent = AwmSkins.default;
    }

    //structure should be shallow extended
    this.structure = AwmUtil.object.extend({}, skinParent.structure);
    if (skinOptions && ('structure' in skinOptions)) {
      AwmUtil.object.extend(this.structure, skinOptions.structure);
    }

    //blueprints should be shallow extended
    this.blueprints = AwmUtil.object.extend({}, skinParent.blueprints);
    if (skinOptions && ('blueprints' in skinOptions)) {
      AwmUtil.object.extend(this.blueprints, skinOptions.blueprints);
    }

    //icons should be shallow extended
    this.icons = AwmUtil.object.extend({}, skinParent.icons, true);
    if (skinOptions && ('icons' in skinOptions)) {
      AwmUtil.object.extend(this.icons.blueprints, skinOptions.icons);
    }
    this.icons.build = function (type, size, options) {
      if (!size) {
        size = 22;
      }

      //return an svg

      var d = this.blueprints[type];
      var svg;
      if (typeof d.svg == 'function') {
        svg = d.svg.call(AwmVideo, options);
      } else {
        svg = d.svg;
      }

      if (typeof size != 'object') {
        size = {
          height: size,
          width: size
        };
      }

      if (typeof d.size != 'object') {
        d.size = {
          height: d.size,
          width: d.size
        };
      }
      if ((!('width' in size) && ('height' in size)) || (!('height' in size) && ('width' in size))) {
        if ('width' in size) {
          size.height = size.width * d.size.height / d.size.width;
        }
        if ('height' in size) {
          size.width = size.height * d.size.width / d.size.height;
        }
      }

      var str = '';
      str += '<svg viewBox="0 0 ' + d.size.width + ' ' + d.size.height + '"' + ('width' in size ? ' width="' + size.width + '"' : '') + ('height' in size ? ' height="' + size.height + '"' : '') + ' class="awm icon ' + type + '">';
      str += '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" height="100%" width="100%">';
      str += svg;
      str += '</svg>';
      str += '</svg>';

      var container = document.createElement('div');
      container.innerHTML = str;

      return container.firstChild;
    };

    //colors should be deep extended
    this.colors = AwmUtil.object.extend({}, skinParent.colors);
    if (skinOptions && ('colors' in skinOptions)) {
      AwmUtil.object.extend(this.colors, skinOptions.colors, true);
    }

    //apply "general" css and  skin specific css to structure
    this.css = AwmUtil.object.extend({}, skinParent.css);
    if (skinOptions && ('css' in skinOptions)) {
      AwmUtil.object.extend(this.css, skinOptions.css);
    }

    return this;
  };
  this.applySkinOptions('skin' in AwmVideo.options ? AwmVideo.options.skin : 'default');


  //load css
  var styles = [];
  for (var i in this.css) {
    if (typeof this.css[i] == 'string') {
      var a = AwmUtil.css.load(AwmVideo.urlappend(this.css[i]), this.colors);
      styles.push(a);
    }
  }
  this.css = styles; //overwrite 


}
