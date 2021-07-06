if (a !== "view" || !b.brand) return;
//if(typeof b.backend_app_name === "undefined") return;

// publisher: 'mediaset',
// platform: 'app',
// aggregate: 'aggregato tgcom24',

window.wtSmart.push(function(wtSmart) {

    b.content_id = (b.content_id || '/');
    b.content_type = (b.content_type || 'page').toLowerCase();
    b.publisher = (b.publisher || b.default_publisher || 'mediaset');
    b.aggregate = (b.aggregate || b.default_aggregate || 'mediaset play');
    var site = (b.default_site || 'mplay');
    var page = (b.publisher || '').toLowerCase() + '-' + site + '-' + b.content_type + '-' + b.content_id;

    site = (b.default_site || 'play');
    if ((b.content_type === 'brand' || b.content_type === 'video' || b.content_type === 'season' || b.content_type === 'articolo') && b.brand) {
      site = b.brand.toLowerCase();
    }
    var prefix_user_id = ""; //su properties RTI lasciare ""
    var user_id = b.user_id || (window.utag_data && window.utag_data.user_id) || (window.utag_data && window.utag_data.user && window.utag_data.user.UID);
    user_id = b.user_uid || (window.utag_data && window.utag_data.user_uid) || (window.utag_data && window.utag_data.user && window.utag_data.user.UID);

    wtSmart.page.data.set({
        name: page,
        category: {
            1: (b.publisher || '').toLowerCase(),
            2: 'ott',
            3: (b.aggregate || '').toLowerCase(),
            4: site,
            9: b.content_type,
            10: b.content_id
        },
        parameter: {
            1: b.slider ? 'refresh_ce-awe': 'no-refresh',
            2: (b.page_title || '').toLowerCase(),
            6: (user_id ? 'loggato': 'no-loggato'),
            53: b.app_rdns ? (b.default_site || 'mplay-app') : (b.default_site || 'mplay-web'),
            54: b.slider,
            55: b.hit_id,
            18: b.user_persona,
        }
    });

    var defaultPurposesIabNa = "1=nd;2=nd;3=nd;4=nd;5=nd;6=nd;7=nd;8=nd;9=nd;10=nd";
    var purposesIab = "";

    if (b.cookie_policy_purposes_allowed && typeof b.cookie_policy_purposes_allowed === "object") {
      purposesIab = ((b.cookie_policy_purposes_allowed.includes(1) || b.cookie_policy_purposes_allowed.includes("1")) ? purposesIab.concat("1=si;") : purposesIab.concat("1=no;"));
      purposesIab = ((b.cookie_policy_purposes_allowed.includes(2) || b.cookie_policy_purposes_allowed.includes("2")) ? purposesIab.concat("2=si;") : purposesIab.concat("2=no;"));
      purposesIab = ((b.cookie_policy_purposes_allowed.includes(3) || b.cookie_policy_purposes_allowed.includes("3")) ? purposesIab.concat("3=si;") : purposesIab.concat("3=no;"));
      purposesIab = ((b.cookie_policy_purposes_allowed.includes(4) || b.cookie_policy_purposes_allowed.includes("4")) ? purposesIab.concat("4=si;") : purposesIab.concat("4=no;"));
      purposesIab = ((b.cookie_policy_purposes_allowed.includes(5) || b.cookie_policy_purposes_allowed.includes("5")) ? purposesIab.concat("5=si;") : purposesIab.concat("5=no;"));
      purposesIab = ((b.cookie_policy_purposes_allowed.includes(6) || b.cookie_policy_purposes_allowed.includes("6")) ? purposesIab.concat("6=si;") : purposesIab.concat("6=no;"));
      purposesIab = ((b.cookie_policy_purposes_allowed.includes(7) || b.cookie_policy_purposes_allowed.includes("7")) ? purposesIab.concat("7=si;") : purposesIab.concat("7=no;"));
      purposesIab = ((b.cookie_policy_purposes_allowed.includes(8) || b.cookie_policy_purposes_allowed.includes("8")) ? purposesIab.concat("7=si;") : purposesIab.concat("8=no;"));
      purposesIab = ((b.cookie_policy_purposes_allowed.includes(9) || b.cookie_policy_purposes_allowed.includes("9")) ? purposesIab.concat("9=si;") : purposesIab.concat("9=no;"));
      purposesIab = ((b.cookie_policy_purposes_allowed.includes(10) || b.cookie_policy_purposes_allowed.includes("10")) ? purposesIab.concat("10=si") : purposesIab.concat("10=no"));
    } else {
      purposesIab = defaultPurposesIabNa;
    }

    if (b.cookie_policy_accepted === "true") {
      wtSmart.page.parameter.add({
        59: 'si',
        17: purposesIab
      });
    } else if (b.cookie_policy_accepted === "false") {
      wtSmart.page.parameter.add({
        59: 'no',
        17: purposesIab
      });
    } else if (typeof b.cookie_policy_accepted === "boolean") {
      wtSmart.page.parameter.add({
        59: b.cookie_policy_accepted?'si':'no',
        17: purposesIab
      });
    } else {
      wtSmart.page.parameter.add({
        59: 'nd',
        17: defaultPurposesIabNa
      });
    }

    if(b.page_section) {
        wtSmart.page.category.add({ 5: (b.page_section || "").toLowerCase() });
    }
    if(b.page_subsection) {
        wtSmart.page.category.add({ 6: (b.page_subsection || "").toLowerCase() });
    }

    var publish_date;
    const date = new Date(b.publish_date);
    if(!isNaN(date.getDate())) {
        publish_date = date.getFullYear()+"-"+(date.getMonth()<9?"0"+(date.getMonth()+1):(date.getMonth()+1))+"-"+(date.getDate()<10?"0"+(date.getDate()):(date.getDate()))+"T"+(date.getHours()<10?"0"+(date.getHours()):(date.getHours()))+":"+(date.getMinutes()<10?"0"+(date.getMinutes()):(date.getMinutes()))+":00.000"+(date.getTimezoneOffset()===-120?"+02:00":"+01:00");
    }
    if(publish_date && b.content_type==="articolo") {
        wtSmart.page.category.add({ 14: publish_date });
    }

    b.page_type = (b.page_type || 'altro').toLowerCase();
    wtSmart.page.parameter.add({ 51: b.page_type });

    if (b.page_url) {
        var wtkValue = wtSmart.utils.parameter('wtk', b.page_url, false);
        if (wtkValue) {
            wtkValue= "wtk%3D" + wtkValue;
            wtSmart.campaign.data.set({
                id: wtkValue,
                parameter: {}
            });
        }
        b.host = (b.host || 'mediasetplay.mediaset.it');
        var replace = "/.*("+b.host+")(.*)/i";
        var re = new RegExp(replace,"g");
        var pageURL = b.page_url
            .replace(re, "https://www.$1$2")
            .split("?")[0];
        wtSmart.page.parameter.add({ 52: pageURL });
        wtSmart.utils.url(pageURL);
    }

    var customer_id;
    if(typeof user_id ==="undefined") {
        if(b.app_rdns) {
            customer_id = "bd:"+b.bd_device_id||b.device_id;
        } else {
            customer_id = "bd:"+b['ut.visitor_id'];
        }
    } else {
        customer_id  = prefix_user_id + user_id;
    }
    wtSmart.customer.data.set({
        id: customer_id,
    });

    if(b.app_rdns) {
        wtSmart.session.parameter.add({
            5: b.backend_app_name
        });
    } else {
        wtSmart.session.parameter.add({
            5: (b.app_name && b.app_name.startsWith("web"))? b.app_name : (b.default_app_name || "web//mediasetplay-web/noversion")
        });
    }


    if(b.app_rdns) {
        wtSmart.session.parameter.add({
            6: b.bd_device_id||b.device_id
        });
    } else {
        wtSmart.session.parameter.add({
            6: b['ut.visitor_id']
        });
    }

    wtSmart.track();
});
