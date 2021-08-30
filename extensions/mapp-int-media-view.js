if (a === 'view' || !(b.event_name === 'video:analytics' || b.tealium_event === 'video:analytics')) {
    return;
  }
  
  var logPrefix = '\t Webtrekk ###';
  var propertyPrefix = (b.default_site || 'mplay');
  var aliveInterval = 120;
  
  if (!(b.video_id || b.video_channel_id) || !b.video_event_type || !b.video_play_request_id) {
    utag.DB(logPrefix + ' ERROR video_id or video_event_type or b.video_play_request_id are missing \n\t\t ' + JSON.stringify(b));
    return;
  }
  
  window._mediasessions = window._mediasessions || {
    r: {},
    h: {
      // create a new Media Session
      init: function(contentId) {
        return {
          mediasession: new wtSmart.extension.media.MediaSession(contentId),
          lastUpdate: new Date().getTime(),
          totalTimeSet: false,
          isPaused: false,
          isStarted: false,
          ad: false,
          adSlotType: undefined,
          lastPlayhead: 0,
          position: 0,
          adCounts: {
            preroll: 1,
            midroll: 1,
            postroll: 1
          }
        };
      },
      // Logger function
      log: function(playRequestId, contentId) {
        var info = playRequestId + '/' + contentId;
        return function() {
          try {
            var message = [].slice.call(arguments)
            message.unshift((info ? ' ' + info + ' ###' : ''));
            message.unshift(logPrefix);
            utag.DB(message.reduce(function(a, m) {
              if (typeof(m) === 'object') {
                m = '\n\t\t' + JSON.stringify(m);
              }
              var spacer = (a.slice(-1) === '=') ? '' : ' ';
              return a + spacer + m;
            }, ''));
          } catch (e) {
            utag.DB(logPrefix + ' ERROR logging ' + e);
          }
        }
      },
      // Get Media Categories
      getCategory: function(dl, event) {
        var category = {
          1: (dl.video_brand_auditel_title || "").toLowerCase(),
          3: (dl.video_typology || "").toLowerCase(),
          4: (dl.video_play_request_type || "").toLowerCase(),
          5: (dl.video_editorial_type || "").toLowerCase(),
          6: (dl.video_name || "").toLowerCase(),
          8: (dl.default_publisher || 'mediaset'),
        };
  
        // not vod
        if (dl.video_play_request_type && String(dl.video_play_request_type).toLowerCase() !== 'vod') {
          utag.ut.merge(category, {
            1: (dl.video_channel_name || "").toLowerCase(),
            5: "full episode"
          },1);
  
          // not live or restart
        } else {
          utag.ut.merge(category, {
            2: (dl.video_subbrand_title || "").toLowerCase(),
            12: dl.video_publish_info_channel,
            13: dl.video_episode_number,
            16: dl.video_season_number,
          },1);
          if (dl.video_series_id) {
            try {
              var brandAnalyticsName = utag.globals.dle.enrichments[window.utag.data.superseries].superseries_data
                .find(function(s) {
                  return s.id === dl.video_series_id;
                }).analyticsName;
              utag.ut.merge(category, {
                1: brandAnalyticsName
              },1);
            } catch (e) {}
          } else if ((dl.video_category === "movie" || dl.programType === "movie") && dl.video_name) {
            utag.ut.merge(category, {
              1: dl.video_name.toLowerCase()
            },1);
          } else {
            log('ERROR video_series_id is missing (getCategory)');
          }
        }
  
        return category;
      },
      // Get Media Parameter
      getParameter: function(dl, event) {
        var parameter = {
          16: (dl.video_play_request_page_url || dl.video_page_url || dl.videoPageUrl || dl.pageUrl || dl.page_url || dl.default_page_url || '').replace(/^.*\/\/(.*)/, 'https://$1'),
          20: dl.video_site_section,
          22: dl.video_ad_block,
          26: (dl.video_autoplay || dl.video_autoplay === "true") ? "si" : "no",
          27: [(dl.video_play_reason || ""), (dl.video_player_behavior || "standard")].join("."),
          51: (dl.third_party_groupLabel && dl.third_party_groupLabel !== "mediaset") ? "syndication" : "mediaset",
          52: (dl.third_party_groupLabel || propertyPrefix) ,
          53: (dl.third_party_subGroupLabel || "mediaset") ,
          54: (dl.app_rdns ? propertyPrefix + '-app' : dl.default_platform || propertyPrefix + '-web'),
          55: (dl.video_play_request_type && String(dl.video_play_request_type).toLowerCase() !== 'vod') ? dl.video_channel_id : dl.video_id,
          57: dl.backend_session_id,
          58: [dl.video_play_request_id, (dl.user_persona || ""), (dl.video_channel_right || ""), (dl.video_referer_id || ""), (dl.video_referer_play_request_id || ""), (dl.bd_device_id || dl.device_id || dl['ut.visitor_id'])].join("."),
          59: dl.video_rec_trackid,
          60: [(dl.video_rec_cid || ""), (dl.video_rec_ctitle || "")].join("."),
        };
  
        // cookie policy
        var cookiePolicyAccepted = dl.cookie_policy_accepted || utag.data.cookie_policy_accepted || (window.utag_data && window.utag_data.cookie_policy_accepted);
        if (cookiePolicyAccepted === "true") {
          utag.ut.merge(parameter, {
            25: 'si'
          },1);
        } else if (cookiePolicyAccepted === "false") {
          utag.ut.merge(parameter, {
            25: 'no'
          },1);
        } else if (dl.IABTCF_TCString) {
          utag.ut.merge(parameter, {
            25: 'si'
          },1);
        }
  
        if (dl.video_play_request_type && String(dl.video_play_request_type).toLowerCase() !== 'vod') {
          utag.ut.merge(parameter, {
            55: dl.video_channel_id
          },1);
          utag.ut.merge(parameter, {
            61: dl.video_epg_fcode
          },1);
        }
  
        if (dl.app_rdns) {
          utag.ut.merge(parameter, {
            24: (dl.backend_app_name || dl.default_app_name || 'app//mediasetplay-app/noversion')
          },1);
        } else {
          utag.ut.merge(parameter, {
            24: (dl.app_name || dl.default_app_name || 'web//mediasetplay-web/noversion')
          },1);
        }
        return parameter;
      },
      // Remove old Media Sessions
      cleanup: function() {
        var now = new Date().getTime();
        try {
          for (var request in window._mediasessions.r) {
            if (window._mediasessions.r[request] && (window._mediasessions.r[request].lastUpdate - now) / 1000 >= 60 * 10) { // clean all sessions after 600 seconds of inactivity
              delete window._mediasessions.r[request];
            }
          }
        } catch (e) {}
      }
    }
  };
  
  var h = window._mediasessions.h;
  h.cleanup();
  
  var playRequestId = b.video_play_request_id;
  var contentId = 'mediaset-video-' + b.video_id;
  
  // contentId for live
  if (b.video_play_request_type && String(b.video_play_request_type).toLowerCase() === 'live') {
    contentId = 'mediaset-video-' + b.video_channel_id;
  
    // contentId for restart
  } else if (b.video_play_request_type && String(b.video_play_request_type).toLowerCase() === 'restart') {
    contentId = 'mediaset-video-' + b.video_channel_id + '-restart';
  }
  
  var log = h.log(playRequestId, contentId);
  
  var ms = window._mediasessions.r[playRequestId];
  if (!ms) {
    log('creating new media session');
    var ms = h.init(contentId);
    window._mediasessions.r[playRequestId] = ms;
  }
  
  var eventName;
  var parameter = h.getParameter(b);
  var category = h.getCategory(b);
  var eventType = b.video_event_type;
  var playhead = b.video_play_playhead || 0;
  playhead = parseInt(playhead, 10);
  var duration = b.video_duration || 0;
  duration = parseInt(duration, 10);
  var adSlotType = (b.video_ad_slot_type && b.video_ad_slot_type.toLowerCase()) || ms.adSlotType;
  var refreshLastUpdate = true;
  
  if (category) {
    ms.mediasession.setCategory(category);
  }
  
  if (duration && !ms.totalTimeSet) {
    log('setting video duration=', duration);
    ms.mediasession.setTotalTime(duration);
    ms.totalTimeSet = true; // set only once
  }
  
  if (b.video_bandwidth) {
    log('setting video bandwidth=', b.video_bandwidth);
    ms.mediasession.setBandwidth(b.video_bandwidth);
  }
  
  if (b.video_volume) {
    log('setting video volume=', b.video_volume);
    ms.mediasession.setVolume(b.video_volume);
  }
  
  if (adSlotType) {
    // Ad events
    if (adSlotType === 'preroll' || adSlotType === 'midroll' || adSlotType === 'postroll') {
      var adSlotName = adSlotType + '-' + ms.adCounts[adSlotType];
  
      if (eventType === 'adImpressionStart') {
        eventName = adSlotName + '-start';
        log(eventType, 'to', eventName, 'playhead=', playhead);
        ms.mediasession.custom(eventName, playhead, parameter);
        ms.ad = true;
        // ms.ad_playhead = playhead;
        ms.adSlotType = adSlotType;
  
      } else if (eventType === 'adImpressionEnd') {
        eventName = adSlotName + '-stop';
        log(eventType, 'to', eventName, 'playhead=', playhead);
        ms.mediasession.custom(eventName, playhead, parameter);
        ms.ad = false;
        ms.adCounts[adSlotType] += 1;
        delete ms.adSlotType;
  
        // } else if (eventType === 'adFirstQuartile' || eventType === 'adMidpoint' || eventType === 'adThirdQuartile') {
        //     eventName = adSlotName + '_pos'
        //     log(eventType, 'to', eventName, 'playhead=', playhead);
        //     ms.mediasession.custom(eventName, playhead);
  
      } else {
        log(eventType, 'discarded for adSlotType=', adSlotType);
      }
  
    } else {
      log(eventType, 'discarded for adSlotType=', adSlotType);
      refreshLastUpdate = false;
    }
  } else {
    // Content events
    if (eventType === 'loadedMetadata') {
      log(eventType, 'to', 'init', 'playhead=', playhead, category, parameter);
      ms.mediasession.init(playhead, parameter);
  
    } else if (eventType === 'playing' || (ms.isPaused && eventType === 'play')) {
      log(eventType, 'to', 'play', 'playhead=', playhead, category, parameter);
      ms.mediasession.play(playhead, parameter);
      ms.isPaused = false;
      ms.isStarted = true;
      ms.lastPlayhead = playhead;
  
    } else if (eventType === 'alive') {
      if (!ms.isPaused && !ms.ad && playhead > ms.lastPlayhead) { // Do not send position during pauses or ads
        log(eventType, 'to', 'alive', 'playhead=', playhead, 'lastPlayhead', ms.lastPlayhead);
        ms.mediasession.position(playhead, parameter);
        if (playhead > 0 && playhead % aliveInterval === 0) {
          if(b.video_play_request_type && String(b.video_play_request_type).toLowerCase() !== 'live') {
            ms.mediasession.custom("alive", playhead, parameter);
          } else {
            ms.mediasession.custom("live-alive", playhead, parameter);
          }
        }
        ms.lastPlayhead = playhead;
      } else {
        log(eventType, 'alive skipped', playhead);
      }
  
    } else if (eventType === 'seek') {
      log(eventType, 'to', 'seek', 'playhead=', playhead);
      if (ms.isStarted) {
        ms.mediasession.seek(playhead, parameter);
      }
      ms.lastPlayhead = playhead;
  
    } else if (eventType === 'pause') {
      log(eventType, 'to', 'playhead=', playhead);
      ms.mediasession.pause(playhead, parameter);
      ms.isPaused = true;
      ms.lastPlayhead = playhead;
  
    } else if (eventType === 'stop') {
      log(eventType, 'to', 'stop', 'playhead=', playhead);
      ms.mediasession.stop(playhead, parameter);
      ms.isPaused = true;
      ms.lastPlayhead = playhead;
  
      // } else if (eventType === 'eof') {
      //     eventName = 'eof';
      //     log(eventType, 'to', eventName, 'playhead=', playhead, duration);
      //     ms.mediasession.custom(eventName, playhead, parameter);
      //     ms.lastPlayhead = playhead;
      //     refreshLastUpdate = true;
  
    } else if (eventType === 'complete') {
      log(eventType, 'to', 'end', 'playhead=', playhead, duration);
      ms.mediasession.end(playhead, parameter);
      ms.isPaused = true;
      ms.lastPlayhead = playhead;
  
    } else {
      log(eventType, 'discarded', 'playhead=', playhead);
      refreshLastUpdate = false;
    }
  }
  
  if (refreshLastUpdate) {
    var now = new Date().getTime();
    // log('updating lastUpdate to', now);
    ms.lastUpdate = now;
  }