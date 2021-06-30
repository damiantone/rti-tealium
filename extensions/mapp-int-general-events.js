/**
 * ricordarsi di aggiornare le rules per evitare di far girare codice inutilmente. Le rule aggiornate da applicare sono queste:
 * referrer_app_cause is defined
 * lifecycle_type equals launch or wake or sleep
*/
if (a === 'view' || b["ut.event"] !== 'link') { return; }

window.wtSmart.push(function(wtSmart) {
    
    var trackEvent = false;
    
    if(typeof b.referrer_app_cause!=="undefined") {
        wtSmart.action.data.set({
        name: b.referrer_app_cause,
        parameter: {
            7: b.referrer_app_detail_1,
            8: b.referrer_app_detail_2,
            9: b.referrer_app_id,
            10: (b.default_site || 'mplay')
        }
        });
        wtSmart.session.parameter.add({ 
            4: b['referrer_app_cause']
        });
        
        //= is %3D because webtrekk needs a double encoding on mc (campaignId)
        if (b.referrer_app_utm_campaign) {
            b.referrer_app_utm_campaign = "wtk%3D" + b.referrer_app_utm_campaign.toLowerCase();
        } else if (b.referrer_app_detail_2) {
            b.referrer_app_utm_campaign = "wtk%3D" + b.referrer_app_detail_2.toLowerCase();
        }
        wtSmart.campaign.data.set({
            id: b.referrer_app_utm_campaign,
            parameter: {}
        });
        trackEvent = true;
    }  else if(b.lifecycle_type=="launch" || b.lifecycle_type=="wake" || b.lifecycle_type=="sleep") {
        wtSmart.action.data.set({
        name: "launch",
        parameter: {1: b.lifecycle_type}
        });
        trackEvent = true;
    }  else {
        //other events
    }
    if(trackEvent) {
        wtSmart.session.parameter.add({ 
            5: b['backend_app_name']
        });
        if(b.app_rdns) {
            wtSmart.session.parameter.add({ 
                6: b.bd_device_id||b.device_id
            });
        } else {
            wtSmart.session.parameter.add({ 
                6: b['ut.visitor_id']
            });
        }
        wtSmart.trackAction();
    }
});