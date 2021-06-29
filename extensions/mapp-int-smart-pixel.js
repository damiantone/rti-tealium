// webtrell smart pixel https://docs.mapp.com/display/WSPD/

 
// loader.min.js - START
window.loaderConfig_ = window.loaderConfig_ || {
    domain: 'static3.mediasetplay.mediaset.it',
    path: '/static/webtrekk/1.2.4/',
    file: 'smart-pixel.min.js'
};

if(typeof require !=="undefined"){
    require.config({
        paths: {
            "wtSmart": "//"+window.loaderConfig_.domain+window.loaderConfig_.path+window.loaderConfig_.file.replace("\.js", "")
        }
    });
} else {
    (function(f,c,a,b){function d(){}var e=c.getElementsByTagName(a)[0];a=c.createElement(a);a.async=!0;a.onload=d;a.onerror=d;if(-1!==c.cookie.indexOf("wtstp_debug=1")||-1!==f.location.hash.indexOf("wtstp_debug"))b.file=b.file.replace(/\.min\./,".debug.");a.src="//"+b.domain+b.path+b.file;e.parentNode.insertBefore(a,e)})(window,document,"script",window.loaderConfig_||{});
}

window.wtSmart = window.wtSmart || [];
window.wtSmart.push(function(wtSmart) {

    // activate page load time plugin (https://docs.mapp.com/display/LTP/Implementing+the+Page+Loading+Time+Plugin)
    // wtSmart.extension.page_load_time.activate();


    // set initial tracking config
    wtSmart.init.set({
        trackId: b['ut.env'] === 'prod' ? '769396664005295' : '419207351539121',
        //trackId: '769396664005295',
        trackDomain: 'mediasetitalia01.wt-eu02.net',
        cookie: '3',
    });

    if (wtSmart.utils.browser.isSafari() || wtSmart.utils.browser.isFirefox() || b.app_rdns || document.location.hostname==="tags.tiqcdn.com") {
        wtSmart.init.add({ cookie: "1" });
    }

    /*wtSmart.session.parameter.set({ 
        5: b['backend_app_name'],
        6: b['ut.visitor_id'],
    });*/
    
    wtSmart.session.parameter.set({ 
        5: b['backend_app_name']
    });
    
});

if(typeof require !=="undefined") {
    require(['wtSmart'], function (webtrekkSmartPixel) {
        var wts = webtrekkSmartPixel.use(window, window.document);
        if(window.wtSmart) {
            if(typeof window.wtSmart.track==="undefined") {
                window.wtSmart.forEach(function(e){wts.push(e)});
            }
        }
        window.wtSmart = wts;
    });  
}