var po_analytics;
po_analytics = {
    observer: [],
    delayToAttach: 2500,
    counter: 0,
    processHistory : {
        initialise : function() {
            po_analytics.processHistory.videoWatches();


        },
        videoWatches : function() {
            var ph = po_analytics.safeStorage.readItem("local","videoTrack",{},"*");
            if (ph)
            {
                for(var i=0; i< ph.length; i++)
                { // begin
                    if(ph[i].tracked !== true) {

                        var index = {index: ph[i].index};
                        var page = ph[i].page;
                        var watched = ph[i].watched;
                        var duration = ph[i].duration ? ph[i].duration : 0;
                        var percentage = ph[i].percentage ? ph[i].percentage : 0;
                        var last = ph[i].last ? ph[i].last : 0;
                        if(last!==0)
                        {
                            percentage = "+" + po_analytics.support.getPercentage(watched-last,duration,true);
                        }
                        var range = ph[i].range;
                        var video = ph[i].src;
                        var label = po_analytics.support.squareBrackets([range, video, percentage + "%", duration]);
                        if (duration !== 0 && percentage !== 0) {
                            dataLayer.push({
                                "clicked": label,
                                "event": "ux_videoMonitor",
                                "evalue": watched - last,
                                "epage": page,
                                "eventVar6" : watched - last,
                                "eventCategory": "UX",
                                "eventAction": "Video Watched"
                            });
                        }
                        else {
                            dataLayer.push({
                                "clicked": po_analytics.support.squareBrackets([range, video]),
                                "event": "ux_video_did_not_watch",
                                "eventCategory": "UX",
                                "eventAction": "Video Did Not Watch",
                                "evalue": watched,
                                "epage": page
                            });

                        }
                        po_analytics.safeStorage.updateItem("local", "videoTrack", index, {tracked: true, last: watched} );
                    }
                } //end
            }

        }

    },
    handlers : { // stuff that outputs custom events

        pages : { // begin pages
             outlets : {
                clearanceContact : function ()
                {
                    var ph = $(this).closest('div.product-modal');
                    var app = angular.element(ph).scope();
                    var items = "", variantsCount = "", colourCount = "", tempprice = "";

                    var range = po_analytics.support.toTitleCase(app.model.selectedRange.rangeName);
                    var evalue = 0;
                    if(window.location.href.indexOf("overstock") > -1 || window.location.href.indexOf("refurbished") > -1)
                    {
                        variantsCount = app.model.selectedRange.products.length;
                        colourCount = app.model.selectedRange.numberOfColours + " colours";

                        items = app.model.selectedRange.products;
                        for (var x in items)
                        {
                            tempprice = items[x].price;
                            if(tempprice < evalue || evalue == 0)
                            {
                                evalue = tempprice;
                            }
                        }
                    }
                    else {
                        variantsCount = app.model.selectedRange.bundles.length;
                        colourCount = app.model.selectedRange.numberOfColours + " colours";
                        items = app.model.selectedRange.bundles;
                        for (var x in items)
                        {
                            tempprice = items[x].bundlePrice;
                            if(tempprice < evalue || evalue == 0)
                            {
                                evalue = tempprice;
                            }

                        }

                    }
                    var label = po_analytics.support.squareBrackets([range,variantsCount+" items",colourCount]);
                    dataLayer.push({"clicked" : label, "event" : "contact_us_outlets", "evalue" : evalue });
                    po_analytics.safePush("contact",{type: "outlets", details: label, status: "initiated" });
                    po_analytics.safePush("ecommerce",{method: "outlets", range: range, price: evalue});
                }


            },
            sofas: { // sofas begin
                outletModal : function(event) {
                    console.log("active");

                    var target = $( event.target );
                    var label = "", customEvent = "", evalue = 0;
                    if (target.is('a'))
                    {
                        customEvent = "contact_us_outlet_range";
                        var app = angular.element(target).scope();
                        var index = {
                            action: "buy",
                            method: "outletRange",
                            grade: "Grade " + app.item.grade,
                            range : po_analytics.support.toTitleCase(app.item.product),
                            colour : po_analytics.custom.variantToColour(app.item.variant,app.model.range.rangeColours),
                            seatType: po_analytics.support.toTitleCase(app.item.item),
                            name: po_analytics.support.toTitleCase(app.item.webDescription),
                            variant: po_analytics.support.toTitleCase(app.item.variant),
                            price: app.item.discountPrice
                        };


                        label = po_analytics.support.squareBrackets([index.range,index.colour,index.variant,index.name]);
                        if(po_analytics.safeStorage.notDuplicate("local","ecommerce",index))
                        {
                            index.status = "initiated";
                            po_analytics.safeStorage.write("local", "ecommerce", index);
                            dataLayer.push({
                                "clicked": label,
                                "event": customEvent,
                                "evalue": evalue,
                                "eventCategory": "Ecommerce",
                                "eventAction": "Buy Click",
                                "eventVar6": index.grade,
                                "eventVar7": index.price.toString(),
                                "eventVar8": index.seatType
                            });

                        }
                    }
                    else {
                        label = "Closed Outlet Window";
                        customEvent = "closed_outlet_range";
                        evalue = 0;
                        // no event sent
                    }


                },
                clicked: function (event) {

                    if (window.location.href.indexOf("/sofas/") > -1) {

                        var outComes = {
                            contact_us_range: {
                                c : "Ecommerce",
                                a : "Buy Click",
                                t : "buy",
                                m : "ranges",
                                action : "ecommerce",
                                g : "new",
                                s : "initiated"
                            },
                            product_zoom: {
                                c : "Product Interaction",
                                a : "Zoom",
                                t : "product",
                                m : "zoom",
                                action : "productIntent",
                                g : "new"
                            },
                            outlet_interest: {
                                c : "Product Interaction",
                                t : "outlets",
                                a : "Outlet Interest",
                                m : "ranges",
                                g : "outlet",
                                action: "productIntent"
                            },
                            callback_range: {
                                c : "Contact Us",
                                a : "Ranges Call Back Click",
                                m : "ranges",
                                channel: "form",
                                t : "callback",
                                action : "contact",
                                s : "initiated"
                            }
                        };
                        var evalue = 0, colour = "", code = "", label = "", range = "", seatType = "", name = "",
                            container = "", customEvent = "contact_us_range", index = {};
                        var target = $(event.target);


                        if (target.is('.range-items button, i, a')) {
                            // buy button, product zoom or outlets link
                            if (target.is('i')) {
                                customEvent = "product_zoom";
                            }

                            var ph = $(this).closest('li');
                            var app = angular.element($('.range-container')).scope();
                            range = po_analytics.support.toTitleCase(app.model.range.range);
                            colour = app.model.range.activeColour.name;
                            code = app.model.range.activeColour.activeQuality.activeVariant.code;
                            app = angular.element($(ph)).scope();
                            container = ph.closest('div.item-group');
                            name = app.item.name;
                            evalue = app.item.price;
                            if (target.is('a')) {
                                //outlets link
                                customEvent = "outlet_interest";
                                evalue = app.item.outletData.data.fromPrice;

                            }

                            app = angular.element($(container)).scope();
                            seatType = app.type.name;
                            label = po_analytics.support.squareBrackets([range, colour, code, name]);
                        }
                        else {
                            //button near bottom
                            var rangePh = angular.element($('.range-container')).scope().model.range;
                            customEvent = "callback_range";
                            range = po_analytics.support.toTitleCase(rangePh.range);
                            colour = rangePh.activeColour.name;
                            code = rangePh.activeColour.activeQuality.activeVariant.code;
                            evalue = 0;
                            label = po_analytics.support.squareBrackets([range, colour, code]);
                            if (po_analytics.safeStorage.notDuplicate("local", outComes[customEvent].action, {
                                    type: outComes[customEvent].t,
                                    channel: outComes[customEvent].channel,
                                    method: outComes[customEvent].m,
                                    status: outComes[customEvent].s,
                                    item: range
                                }, false)) {
                                dataLayer.push({
                                    "clicked": label,
                                    "event": customEvent,
                                    "evalue": evalue,
                                    "eventCategory": outComes[customEvent].c,
                                    "eventAction": outComes[customEvent].a
                                });
                            }
                        }


                        if (customEvent == "contact_us_range") {
                            // revise this for back tracking
                            index = {
                                action: outComes[customEvent].t,
                                status: outComes[customEvent].s,
                                method: outComes[customEvent].m,
                                range: range,
                                colour: colour,
                                variant: code,
                                seatType: seatType,
                                name: name,
                                price: evalue,
                                grade: outComes[customEvent].g
                            };
                            if (po_analytics.safeStorage.notDuplicate("local", outComes[customEvent].action, index, false)) {
                                dataLayer.push({
                                    "clicked": label,
                                    "event": customEvent,
                                    "evalue": evalue,
                                    "eventCategory": outComes[customEvent].c,
                                    "eventAction": outComes[customEvent].a,
                                    "eventVar6": index.grade,
                                    "eventVar7": index.price.toString(),
                                    "eventVar8": index.seatType
                                });
                            }

                        }
                        else if (evalue > 0) {
                            // zoom or outlet view

                            index = {
                                action: outComes[customEvent].t,
                                method: outComes[customEvent].m,
                                range: range,
                                colour: colour,
                                variant: code,
                                seatType: seatType,
                                name: name,
                                price: evalue,
                                grade: outComes[customEvent].g
                            };


                            if (po_analytics.safeStorage.notDuplicate("local", outComes[customEvent].action, index, false)) {
                                dataLayer.push({
                                    "clicked": label,
                                    "event": customEvent,
                                    "evalue": evalue,
                                    "eventCategory": outComes[customEvent].c,
                                    "eventAction": outComes[customEvent].a,
                                    "eventVar6": index.grade,
                                    "eventVar7": index.price.toString(),
                                    "eventVar8": index.seatType
                                });

                            }

                        }


                    }


                },


                swatches : { // begin swatches

                    arrows : function(event) {
                        var app = angular.element($(this)).scope();
                        var direction = $(event.target).attr('class').indexOf("left") > -1 ? "left" : "right";
                        (function(app,direction) {
                            setTimeout(function() {
                                var code = app.model.range.activeColour.activeQuality.activeVariant.code;
                                var colour = app.model.range.activeColour.name;
                                var range = po_analytics.support.toTitleCase(app.model.range.range);
                                var variantsCount = app.model.range.activeColour.activeQuality.variants.length;
                                var label =  po_analytics.support.squareBrackets([range,colour,code]);
                                var evalue = po_analytics.custom.getSwatchPos(app);
                                var method = direction+" arrow";
                                var output = { colour: colour, range: range };
                                po_analytics.handlers.pages.sofas.swatches.trackSwatch(output);
                                if(po_analytics.safeStorage.notDuplicate("local","swatches", {range: range, variant: code, colour: colour },false,{method: method, range: range, variant: code, colour: colour, position: evalue, available: variantsCount})) {
                                    dataLayer.push({
                                        "clicked": label,
                                        "event": "swatch_arrows",
                                        "eventCategory": "Swatches",
                                        "eventAction": "Swatch Selected",
                                        "eventVar6": method,
                                        "eventVar7": evalue.toString(),
                                        "eventVar8": variantsCount.toString(),
                                        "evalue": evalue
                                    });
                                }
                            },250);
                        })(app,direction);
                    },
                    trackSwatch : function(output)
                    {
                        $('ul.swatch-group').unbind("scroll",po_analytics.handlers.pages.sofas.swatches.scrolled).bind("scroll",output,po_analytics.handlers.pages.sofas.swatches.scrolled);
                        $('.inner-wrapper button').unbind("click",po_analytics.handlers.pages.sofas.swatches.closed).bind("click",po_analytics.handlers.pages.sofas.swatches.closed);
                    },
                    scrolled : function(event)
                    {
                        var data = event.data;
                        $('ul.swatch-group').unbind("scroll", po_analytics.handlers.pages.sofas.swatches.scrolled);
                        // we don't need to fire this lots
                        if(po_analytics.safeStorage.notDuplicate("local","UX", {range: data.range, method: "scroll", colour: data.colour }, false)) {
                            dataLayer.push({
                                "clicked": data.colour,
                                "event": "swatch_scroll",
                                "eventCategory" : "Swatches",
                                "eventVar6" : data.range,
                                "eventAction" : "Scroll Used"
                            });
                        }
                    },
                    closed : function() {
                        var update = false;
                        var app = angular.element($(this)).scope();
                        var code = app.model.range.activeColour.activeQuality.activeVariant.code;
                        var colour = app.model.range.activeColour.name;
                        var range = po_analytics.support.toTitleCase(app.model.range.range);
                        var variantsCount = app.model.range.activeColour.activeQuality.variants.length;
                        var evalue = po_analytics.custom.getSwatchPos(app);
                        var label = po_analytics.support.squareBrackets([range, colour, code]);
                        if (po_analytics.safeStorage.notDuplicate("local", "swatches",{range: range, variant: code, colour: colour},false,{method: "closed",range: range, variant: code,colour: colour,position: evalue,available: variantsCount }))
                        { // first appearance, swatch event
                            update = true;
                        }
                        else {
                            if (po_analytics.safeStorage.notDuplicate("local", "swatches",{range: range, variant: code, colour: colour, method: "closed"}))
                            {
                                po_analytics.safeStorage.updateItem("local", "swatches", {range: range,variant: code,colour: colour}, {method: "closed"});
                                update = true;
                            }

                        }
                        if(update)
                        {
                            dataLayer.push({
                                "clicked": label,
                                "event": "swatch_closed",
                                "eventCategory": "Swatches",
                                "eventAction": "Swatch Selected",
                                "eventVar6": "closed",
                                "eventVar7": evalue.toString(),
                                "eventVar8": variantsCount.toString(),
                                "evalue": evalue
                            });
                        }

                    },
                    colourSelected : function() {
                        var app = angular.element($(this)).scope();
                        var colour = app.colour.name;
                        var quantity = app.colour.quantity;
                        var range = po_analytics.support.toTitleCase(app.model.range.range);
                        var output = { colour: colour, range: range, quantity: quantity };
                        if(po_analytics.safeStorage.notDuplicate("local", "colours", output, false))
                        {
                            dataLayer.push({"clicked" : colour,
                                "event" : "swatch_stage_1",
                                "eventCategory" : "Swatches",
                                "eventAction" : "Colour Selected",
                                "eventVar6": range,
                                "eventVar7" : quantity.toString(),
                                "evalue" : app.colour.quantity });

                        }

                        (function(output) {
                            setTimeout(function() {
                                po_analytics.handlers.pages.sofas.swatches.trackSwatch(output);
                            },500);

                        })(output);
                    },
                    clickedItem : function() {
                        var app = angular.element($(this)).scope();
                        var evalue = po_analytics.custom.getSwatchPos(app);
                        var range = po_analytics.support.toTitleCase(app.model.range.range);
                        var colour = app.model.range.activeColour.name;
                        var variantsCount = app.model.range.activeColour.activeQuality.variants.length;
                        var code = app.model.range.activeColour.activeQuality.activeVariant.code;
                        var label  = po_analytics.support.squareBrackets([range,colour,code]);

                        if(po_analytics.safeStorage.notDuplicate("local","swatches", {range: range, variant: code, colour: colour },false,{method: "clicked", range: range, variant: code, colour: colour, position: evalue, available: variantsCount})) {
                            dataLayer.push({
                                "clicked": label,
                                "event": "swatch_stage_2",
                                "eventCategory": "Swatches",
                                "eventAction": "Swatch Selected",
                                "eventVar6": "clicked",
                                "eventVar7": evalue.toString(),
                                "eventVar8": variantsCount.toString(),
                                "evalue": evalue
                            });
                        }

                    }

                } //end swatches

            } // sofas end
        }, //end pages
        postCodeSearch : function (event) {
            var label = window.location.href.indexOf("/sofas/") > -1 ? {l: "Sofas", m: "ranges" } : {l: "Non-Sofas", m: "generic"};
            var pc = po_analytics.support.postCodeArea($('input#userPostcode').val());
            if(po_analytics.safeStorage.notDuplicate("local", "storeFinder", {action: "searched", m: label.m  },false)) {
                dataLayer.push({
                    "clicked": label.l,
                    eventCategory: "Store Finder",
                    eventAction: "Searched",
                    "event": "store_finder_search",
                    "eventVar6": pc
                });
            }
        },
        externalLink : function() {
            var output = "External Link";
            var link = $(this).attr('href');
            var ph = link.split("/")[2].split(".");
            var domain = false;
            if(ph[1] !== undefined)
            {
                domain = [];
                for (var i = 1;i<ph.length; i++)
                {

                    domain.push(ph[i]);

                }
                domain = domain.join(".");
            }
            var sofology = domain.indexOf("sofology.co.uk") > -1;

            if(sofology)
            {
                output = link.indexOf("myaccount") > -1 ? "My Account" : "Careers";
            }
            else
            {
                output = domain;

            }


            output = sofology ? output + " (Sofology)" : output;
            dataLayer.push({"clicked" : output, eventCategory: "UX", eventAction: "External Link", "event" : "external_link" });
        },
        ajaxTracking : function (event,xhr,settings) {
            // catches site search and form completions.
            var sessionCounter = 0;
            var data = "";
            if(settings.url.indexOf("https://api.sofology.co.uk/api/catalogueSearch/") > -1)
            {
                var keyword = encodeURIComponent(settings.url.replace("https://api.sofology.co.uk/api/catalogueSearch/","").toLowerCase().trim());
                var searchResults = JSON.parse(xhr.responseText);
                var evalue = searchResults.length;
                if(evalue == "0")
                {
                    if(typeof $('form.search-form li')[0] !== 'undefined')
                    {
                        dataLayer.push({"clicked" : keyword, eventCategory: "Search", eventAction : "No Results", "event" : "search_no_results", "evalue": evalue});
                    }
                    else
                    {
                        dataLayer.push({"clicked" : keyword, "event" : "search_no_results_bug", "evalue": evalue});
                    }

                }
                dataLayer.push({"clicked" : keyword, "event" : "search_filtered_pageview", "evalue": evalue});
                // no event, just a virtual pageview
                po_analytics.safeStorage.write("local","siteSearch",{keyword: keyword, results: evalue });
            }
            if(settings.url == "https://api.sofology.co.uk/api/callback")
            {
                data = settings.data ? settings.data : "";
                var callBackTime = po_analytics.support.processResponse(data,"CallBackTime");
                dataLayer.push({"clicked" : "Stage 2 Complete: " + callBackTime, eventCategory: "Contact Us", eventAction : "Call Back", "event" : "contact_us_callback_stage_2", "evalue" : sessionCounter});
                po_analytics.safeStorage.write("local","contact",{channel: "form", type: "callback", details: callBackTime, status: "completed"});
            }
            if(settings.url == "https://api.sofology.co.uk/api/enquiry")
            {
                data = settings.data ? settings.data : "";
                var enquiryType = $('select option[value='+po_analytics.support.processResponse(data,"EnquiryTypeId")+']');
                enquiryType = enquiryType ? enquiryType.text() : "Unknown";
                dataLayer.push({"clicked" : enquiryType, eventCategory: "Contact Us", eventAction : "Enquiry Complete", "event" : "contact_us_enquiry_complete", "evalue" : sessionCounter});
                po_analytics.safeStorage.write("local","contact",{channel: "form", type: "enquiry", details: enquiryType, status: "completed"});
            }
        },
        videoProcess : function(event)
        {
            var video = event.target.currentSrc;
            var index = {index: video.split("?")[0].split('/').pop()};


            var sofas = false, range = "", label = "", customEvent = "";
            if (window.location.href.indexOf("/sofas/") > -1) {
                sofas = true;
            }

            if (window.po_analytics && po_analytics.safeStorage && po_analytics.safeStorage.pageCache) {
                var data = po_analytics.safeStorage.readItem("local", "videoTrack",index,"*")[0];
                if(data !== undefined)
                {
                    if (event.type == 'play') {
                        if (!(data.videoPlay > 0)) {
                            po_analytics.safeStorage.updateItem("local","videoTrack",index, {videoPlay: 1});
                            customEvent = "sofa_video_play";

                            if (sofas) {
                                range = po_analytics.support.toTitleCase(angular.element(event.target).scope().model.range.range);
                                po_analytics.safeStorage.notDuplicate("local","productIntent",{action: "videoPlay", range: range},false);

                            } else {

                                range = "Non-Sofa";

                            }
                            label = po_analytics.support.squareBrackets([range, video]);

                            dataLayer.push({
                                "clicked": label,
                                "event": customEvent,
                                "evalue": 0,
                                "eventCategory": "Product Interaction",
                                "eventVar6" : range,
                                "eventVar7" : "play",
                                "eventAction" : "Video"
                            });
                        } else {
                            po_analytics.safeStorage.updateItem("local","videoTrack", index,"videoPlay",1)
                        }

                    } else if (event.type == 'ended') {
                        if (!(data.videoEnd > 0)) {
                            po_analytics.safeStorage.updateItem("local","videoTrack",index, {videoEnd: 1});
                            customEvent = "sofa_video_ended";

                            if (sofas) {
                                range = po_analytics.support.toTitleCase(angular.element(event.target).scope().model.range.range);
                            } else {
                                range = "Non-Sofa";
                            }
                            label = po_analytics.support.squareBrackets([range, video]);
                            dataLayer.push({
                                "clicked": label,
                                "event": customEvent,
                                "evalue": 0,
                                "eventCategory": "Product Interaction",
                                "eventVar6" : range,
                                "eventVar7" : "ended",
                                "eventAction" : "Video"
                            });
                        } else {
                            po_analytics.safeStorage.updateItem("local","videoTrack", index,"videoEnd",1)
                        }

                    } else if (event.type == 'timeupdate') {
                        var update = {};
                        if (data.duration == 0) {
                            // get accurate length of video
                            po_analytics.safeStorage.updateItem("local", "videoTrack", index, {duration: parseFloat(event.target.duration.toFixed(1))});
                            data.duration = parseFloat(event.target.duration.toFixed(1));
                        }

                        if (event.target.currentTime > parseFloat(data.watched))
                        {
                            update.tracked = false;
                            update.watched = parseFloat(event.target.currentTime.toFixed(1));
                            update.percentage = po_analytics.support.getPercentage(update.watched,data.duration,true);
                            po_analytics.safeStorage.updateItem("local","videoTrack",index,update);
                        }
                    }
                }
            }
        }

    },
    tracking : {

        initialise : function() {
            // track page
            var depth = po_analytics.safeStorage.readItem("local", "pages", "url");
            depth = depth ? depth.length + 1 : 1;
            po_analytics.safeStorage.write("local", "pages", {
                url: po_analytics.support.cleanURL("host"),
                timestamp: po_analytics.support.getTime(),
                depth: depth
            });

            if (typeof po_analytics.observer !== 'undefined' && po_analytics.observer !== null && po_analytics.observer.length > 0)
            {
                for(var x in po_analytics.observer)
                {
                    po_analytics.observer[x].disconnect();
                }
                po_analytics.observer = [];
            }
            var ph = [];
            if(window.ga && ga.create)
            {
                ph = po_analytics.tracking.pages();
            }
            else
            {
                dataLayer.push({"clicked" : "Load failed", "event" : "google_analytics_error"});
            }

            for(var x in ph)
            {
                if(window.location.href.indexOf(ph[x].url) > -1) {

                    if(typeof ph[x].time === 'undefined')
                    {
                        po_analytics.support.monitorChanges(ph[x].url,ph[x].data);
                    }
                    else
                    {
                        po_analytics.support.monitorChanges(ph[x].url,ph[x].data,ph[x].time);
                    }

                }

            }


        },
        pages: function () {
            return [{url: "/sofas/", data: po_analytics.tracking.custom.sofaPage()},
                {url: "/clearance-sofas", data: po_analytics.tracking.custom.clearancePage()},
                {url: "/", data: po_analytics.tracking.siteWide(), time: 1}
            ];
        },
        siteWide: function () {
            return [
                {
                    monitorElement: false,
                    selectedFunction: po_analytics.handlers.ajaxTracking,
                    elementToAttach: document,
                    attachType: 'ajaxSuccess'
                },
                {
                    monitorElement: false,
                    selectedFunction: po_analytics.processHistory.initialise,
                    elementToAttach: window,
                    attachType: 'unload'
                },
                {
                    monitorElement: false,
                    selectedFunction: po_analytics.handlers.videoProcess,
                    elementToAttach: 'video',
                    attachType: 'timeupdate pause play ended',
                    delay: 3000
                },
                {
                    monitorElement: false,
                    selectedFunction: po_analytics.handlers.externalLink,
                    elementToAttach: 'a[href*=http]',
                    attachType: po_analytics.support.device
                }
            ];
        },
        custom: {
            clearancePage: function () {
                return [{
                    monitorElement: '#refurb-container',
                    elementAttribute: 'class',
                    elementValue: 'product-modal',
                    selectedFunction: po_analytics.handlers.pages.clearanceContact,
                    elementToAttach: '.order-direct a'
                }];
            },
            sofaPage: function () {
                return [{
                    monitorElement: 'div.range',
                    elementAttribute: 'id',
                    elementValue: 'range-items',
                    selectedFunction: po_analytics.handlers.pages.sofas.clicked,
                    elementToAttach: 'button[click-live-chat], i.fa-search-plus, .range-items a:contains("Outlet")',
                    attachType: po_analytics.support.device,
                    delay: 3000
                },
                    {
                        monitorElement: 'div.materials',
                        elementAttribute: 'class',
                        elementValue: 'swatch-group',
                        selectedFunction: po_analytics.handlers.pages.sofas.swatches.clickedItem,
                        elementToAttach: '.swatch-group li'
                    },
                    {   monitorElement: 'body',
                        elementAttribute: 'class',
                        elementValue: 'modal__content',
                        selectedFunction: po_analytics.handlers.pages.sofas.outletModal,
                        attachType: po_analytics.support.device,
                        elementToAttach: '.modal__content a[enquiry-type=contactUs], .ngdialog-content .ngdialog-close',
                        delay: 1000
                    },
                    {
                        monitorElement: false,
                        selectedFunction: po_analytics.handlers.pages.sofas.swatches.colourSelected,
                        elementToAttach: 'div.colours ul li'
                    },
                    {
                        monitorElement: false,
                        selectedFunction: po_analytics.handlers.postCodeSearch,
                        elementToAttach: 'form[name=postcodeSearch]',
                        attachType: "submit"
                    },
                    {
                        monitorElement: false,
                        selectedFunction: po_analytics.handlers.pages.sofas.swatches.arrows,
                        elementToAttach: '#materials button i'
                    }];
            }
        },
        uX:
        {
            videos : function () {
                // checks page for videos and grabs stats
                setTimeout(function () {
                    var cacheSel = $('video');
                    if (cacheSel.length > 0) {

                        var sofas = false;
                        if (window.location.href.indexOf("/sofas/") > -1) {
                            sofas = true;
                        }

                        cacheSel.each(function () {

                            var output = {};
                            output.src = $(this)[0].currentSrc;
                            output.index = output.src.split("?")[0].split('/').pop();
                            output.duration = $(this).readyState ? $(this)[0].duration : 0;
                            output.duration = output.duration !== null ? output.duration : 0;
                            output.page = po_analytics.support.cleanURL("host");
                            output.range = sofas ? po_analytics.support.toTitleCase(angular.element($(this)).scope().model.range.range) : "Non-Sofa";
                            output.watched = 0;
                            po_analytics.safeStorage.notDuplicate("local","videoTrack",{index: output.index},false,output);

                        });

                    }
                }, 3000);
            },
            initialise : function() {
                po_analytics.tracking.uX.videos();
            }
        }

    },
    initialise: function () {
        po_analytics.counter++; // angularJS hack
        po_analytics.safeStorage.initialise(); // load data
        po_analytics.tracking.initialise();
        po_analytics.tracking.uX.initialise();
        po_analytics.processHistory.initialise();


    }
};

po_analytics.cookies = {
// Work in progress
    // main purpose here is to count how many sessions without converting. Cookie acts like a counter that is reset when a desired action occurs.
    // Two types of interaction are supported,
    // 1. Regular sessions. A cookie is dropped that lasts 120 days and is incremented with each return visit.
    // 2. Sessions with "desired" interaction, e.g. reaching the checkout URL.
    // This can occur in 2 ways.
    // (i) The URL triggering the event can be added to the interactionURLs array, e.g. var po_data = {interactionURLs : ["http://www.example.com/checkout/", "https://www.example.com/checkout/"]}
    // When the initialise function is called, this will be checked and if the URL matches the specified ones.
    // (ii) Just calling the po_analytics.cookies.interaction() function
    // The interaction session counter is incremented and the session is classed as a session with interaction. Checks mean that this can only occur once in that session.
    // These counters are both reset when a specified action occurrs. This can occur in 2 ways
    // (i) The URL will need adding to the transactionURLs array, e.g. var po_data = {transactionURLs : ["http://www.example.com/checkout/success", "https://www.example.com/checkout/success"]}

    names: {
        // names of cookies can be customised based on po_data settings, e.g. var po_data = {visitCookie: "_welcome", liveCookie: "_active"}
        session: window.po_data && po_data.visitCookie ? po_data.visitCookie : "_sessionCookie",
        live: window.po_data && po_data.liveCookie ? po_data.liveCookie : "_liveCookie",
        interaction: window.po_data && po_data.interactionCookie ? po_data.interactionCookie : "_ixCookie"
    },
    data: {
        sessionID: po_analytics.safeStorage ? po_analytics.safeStorage.readItem("local", "sessionInfo", "id")[0] : null,
        domain: window.po_data && po_data.cookieDomain ? po_data.cookieDomain : ("^" + window.location.hostname).replace("^www.", "").replace("^", ""),
        interactionURLs: window.po_data && po_data.interactionURLs ? po_data.interactionURLs : [],
        transactionURLs: window.po_data && po_data.transactionURLs ? po_data.transactionURLs : []
    },
    checkURLReached: function(data) {
        data = (typeof data === 'undefined') ? this.cookies.interactionURLs : data;
        if (data.length > 0) {
            return (data.indexOf(po_analytics.support.cleanURL(true)) > -1);

        } else {
            return false;
        }
    },
    erase: function(name) {
        this.create(name, "", -1);
    },
    read: function(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    },
    update: function(name, initValue, days) {
        if (this.read(name) !== null) {
            var value = this.read(name);
            this.create(name, value, days);
        } else {
            this.create(name, initValue, days);
        }
    },
    create: function(name, value, days) {
        var path = "; path=/";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            var expires = "; expires=" + date.toGMTString();
        } else var expires = "";
        if (this.data.domain) {
            path = ";domain=." + this.data.domain + path;
        }
        document.cookie = name + "=" + value + expires + path;
    },
    increment: function(name) {
        var cookieVisits = this.read(name);
        var totalVisits = cookieVisits ? parseInt(cookieVisits) : 0;
        this.create(name, totalVisits + 1, 120);
    },
    liveSession: function() {
        return this.read(this.names.live);
    },
    sessionCounter: function() {
        // easy way of accessing how many non-converting sessions
        return this.read(this.names.session);
    },
    interactionCounter: function() {
        // easy way of accessing how many non-converting sessions that had interactions
        return this.read(this.names.interaction) ? this.read(this.names.interaction) : 0;
    },
    interaction: function() {
        if (this.liveSession() == 1) {
            this.increment(this.names.interaction);
            this.erase(this.names.live);
            this.update(this.names.live, 2, 0);
        }
    },
    reset: function() {
        this.erase(this.names.live);
        this.erase(this.names.interaction);
    },
    initialise: function() {

        if (this.liveSession() == null) {
            this.increment(this.names.session);
        }
        this.update(this.names.live, 1, 0);
        if (this.liveSession() == 1 && this.checkURLReached(this.data.interactionURLs)) {
            this.interaction();
        }
        if (this.checkURLReached(this.data.transactionURLs)) {
            this.reset();
        }
        return true;
    }


};

po_analytics.custom = {

    determinePageType : function()
    {


    },
    variantToColour : function(shade,product)
    {
        var output = {};
        var name;
        for(var x1 in product)
        {
            var colour = product[x1].name;
            for(var x2 in product[x1].materialQualityTypes)
            {
                for(var x3 in product[x1].materialQualityTypes[x2].variants)
                {
                    name = po_analytics.support.toTitleCase(product[x1].materialQualityTypes[x2].variants[x3].code);
                    output[name] = colour;
                }
            }
        }
        if(typeof output[shade] !== 'undefined')
        {
            return output[shade];
        }
        else return "?";
    },
    getSwatchPos : function(app) {

        var ph = app.model.range.activeColour.activeQuality.variants;
        var evalue  = 0;
        var code = app.model.range.activeColour.activeQuality.activeVariant.code;
        for(var x in ph)
        {
            if(code == ph[x].code)
            {
                evalue = (parseInt(x)+1);
            }
        }
        return evalue;
    }

};

po_analytics.support = {
    monitorChanges : function(pageChecked, monitorArray, delayToAttach) {
        if (typeof delayToAttach === 'undefined') {
            delayToAttach = po_analytics.delayToAttach;

        }
        if (window.location.href.indexOf(pageChecked) > -1) {

            for (var x in monitorArray) {

                var monitorElement = monitorArray[x]['monitorElement'];
                var elementAttribute = typeof monitorArray[x]['elementAttribute'] !== 'undefined' ? monitorArray[x]['elementAttribute'] : undefined;
                var elementValue = typeof monitorArray[x]['elementValue'] !== 'undefined' ? monitorArray[x]['elementValue'] : undefined;
                var attachType = typeof monitorArray[x]['attachType'] !== 'undefined' ? monitorArray[x]['attachType'] : "click";
                var delay = typeof monitorArray[x]['delay'] !== 'undefined' ? monitorArray[x]['delay'] : delayToAttach;
                var selectedFunction = monitorArray[x]['selectedFunction'];
                var elementToAttach = monitorArray[x]['elementToAttach'];


                (function(eL, aT, sF) {

                    // bind first use.
                    setTimeout(function() {

                        $(eL).unbind(aT, sF).bind(aT, sF);

                    }, delay);

                })(elementToAttach, attachType, selectedFunction);


                if (monitorElement) {

                    (function(index, mE, eA, eV, eL, aT, sF, dL) {

                        // bind first use.
                        setTimeout(function() {
                            // time out to load things

                            var contentDiv = document.querySelector(mE) ? document.querySelector(mE) : undefined;
                            if (typeof contentDiv !== 'undefined') {
                                var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
                                po_analytics.observer[index] = new MutationObserver(function(mutations) {
                                    mutations.forEach(function(mutation) {

                                        if (mutation.target.hasAttribute(eA)) {

                                            if (mutation.target.getAttribute(eA).indexOf(eV) > -1) {
                                                (function(eTA, aTy, seF) {
                                                    setTimeout(function() {
                                                        $(eTA).unbind(aTy, seF).bind(aTy, seF);
                                                    }, (dL));
                                                })(eL, aT, sF);
                                            }
                                        }
                                    });
                                });
                                var config = {
                                    attributes: true,
                                    attributeOldValue: true,
                                    childList: true,
                                    subtree: true
                                };
                                po_analytics.observer[index].observe(contentDiv, config);

                            }


                        }, delay);

                    })(x, monitorElement, elementAttribute, elementValue, elementToAttach, attachType, selectedFunction, delay);


                } // end If
            }
        }
    }, //end
    postCodeArea : function (value) {

        var patt = new RegExp("[A-Za-z]{1,2}[0-9]{1,2}[A-Za-z]{0,1}");
        var res = patt.exec(value).toString();
        while(res.length >= value.length - 2 && value.length > 4)
        {
            res = res.slice(0,-1);
        }
        return res.toUpperCase();

    },
    getPercentage : function(number, divisor, cap) {
        cap = typeof cap === undefined;
        var percentage = (number / divisor) * 100;
        percentage = parseFloat(percentage.toFixed(1));
        if(percentage>100 && cap)
        {
            return 100;
        }
        return percentage
    },
    cleanURL: function(pageOnly) {
        // gets the URL and cleans it.By default, strips out some common URL parameters. Optional parameter pageOnly. Set it to anything to include the domain and protocol.
        pageOnly = (typeof pageOnly === 'undefined');
        var host = "";
        if (!pageOnly) {
            host = window.location.href.split(window.location.hostname)[0] + window.location.hostname;
        }
        var ignoredParameters = window.po_data && po_data.ignoredParameters ? po_data.ignoredParameters : ["gclid", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
        var url = window.location.href.split(window.location.hostname)[1].toLowerCase();
        var ph = url.split("#")[0].split("?");
        if (ph[1] === undefined) {
            return host + ph[0];
        } else {

            var query = {};
            var a = ph[1].split('&');
            for (var i = 0; i < a.length; i++) {

                var b = a[i].split('=');
                query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
            }
            for (var i = 0; i < ignoredParameters.length; i++) {
                delete query[ignoredParameters[i]];
            }
            var str = [];
            for (var p in query)
                if (query.hasOwnProperty(p)) {
                    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(query[p]));
                }
            ph[1] = str.join("&");
            var qm = ph[1].length > 0 ? "?" : "";
            return host + ph[0] + qm + ph[1];
        }

    },
    getTime: function() {
        // readable timestamp
        var now = new Date();
        var tzo = -now.getTimezoneOffset();
        var dif = tzo >= 0 ? '+' : '-';
        var pad = function(num) {
            var norm = Math.abs(Math.floor(num));
            return (norm < 10 ? '0' : '') + norm;
        };
        return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + 'T' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds()) + '.' + pad(now.getMilliseconds()) + dif + pad(tzo / 60) + ':' + pad(tzo % 60);
    },
    processResponse: function(data, value) {
        // reads query string for specified value
        var container = {};
        data.split("&").forEach(function(item) {
            var result = item.split("=");
            container[result[0]] = decodeURIComponent(result[1]).replace(/\+/g, ' ');
        });
        return container[value] ? container[value] : "";
    },
    squareBrackets: function(strings) {
        // encapsulates array with square brackets
        var output = [];
        for (var x in strings) {
            output.push("[" + strings[x] + "]");
        }
        return output.join(" ");
    },
    device: ('ontouchstart' in document.documentElement) ? 'touchstart' : 'mousedown',

    sessionID: function() {
        // generates random session ID. Stored elsewhere.
        return new Date().getTime() + '.' + Math.random().toString(36).substring(5);
    },
    toTitleCase: function(str) {
        // proper cases text.
        return str.replace(/\w\S*/g, function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }

};

po_analytics.safeStorage = {

    protocols: ["now", "local", "session"],
    expireMethods: ["days", "expire"],
    pageCache: {},
    initialise : function() {

        if(po_analytics.counter>1 && po_analytics.safeStorage.constants.mode == "days")
        {
            // angularJS pages so no unload
            po_analytics.safeStorage.unloadUpdate();
        }
        po_analytics.safeStorage.setUpSession();

        if (po_analytics.safeStorage.constants.mode == "days") {
            po_analytics.safeStorage.processData();


            window.addEventListener("beforeunload", function(e) {
                po_analytics.safeStorage.unloadUpdate();
                return null;
            });
            po_analytics.safeStorage.constants.fired = false;
        }

    },
    constants : {
        fired: false,
        version: 1,
        expireTime: window.po_data && po_data.expireTime ? po_data.expireTime : 30,
        daysExpire: window.po_data && po_data.daysExpire ? po_data.expireTime : 120,
        key: "43534534BZZJ",
        sessionID: function() {
            if (po_analytics.safeStorage.pageCache && po_analytics.safeStorage.pageCache.sessionInfo && po_analytics.safeStorage.pageCache.sessionInfo.data) {
                return po_analytics.safeStorage.pageCache.sessionInfo.data[0].id;
            } else return po_analytics.safeStorage.readItem("now", "sessionInfo", "id")[0];
        },
        mode: window.po_data && po_data.mode ? po_data.mode : "days"
        // other value is "expire"
    },
    resolveVersionConflicts : function(newList, oldList) {

        var newListoTS = newList.ots;
        var filteredList = [];
        var previousTS = [];
        var newTS = [];
        var updates = false;
        for (var i = 0; i < newList.data.length; i++) { // loop through and find the fresh stuff
            if (newList.data[i] && newList.data[i].v) {
                if (newList.data[i].v > newList.v) { // newer than what was loaded into pagecache
                    updates = true;
                    newList.data[i].v = oldList.v + 1;
                    filteredList.push(newList.data[i]);
                    newTS.push(newList.data[i].ts);
                } else {
                    previousTS.push(newList.data[i].ts);
                }
            }

        } // end fresh stuff check
        if (updates && oldList.data) {
            for (var i = 0; i < oldList.data.length; i++) { // check each value
                var noConflict = newTS.indexOf(oldList.data[i].ts);
                if (noConflict < 0) { // not in list, add away
                    if (oldList.data[i].ts > newListoTS || previousTS.indexOf(oldList.data[i].ts) > -1) // newer or found in both lists
                    {
                        filteredList.push(oldList.data[i]);
                    } else {
                        // it was probably deleted.
                    }
                } else { // try to merge values
                    var replaceMentValue = {};
                    for (var property in filteredList[noConflict]) { //loop through properties for conflicts
                        if (oldList.data[i][property] !== undefined) {
                            // matching check for conflicts
                            if (oldList.data[i][property] == filteredList[noConflict][property]) {
                                replaceMentValue[property] = oldList.data[i][property];
                            } else if (oldList.data[i][property] === true || oldList.data[i][property] > filteredList[noConflict][property]) {
                                // it's true or more, we keep values to to true
                                replaceMentValue[property] = oldList.data[i][property];
                            } else {
                                replaceMentValue[property] = filteredList[noConflict][property];
                            }

                        } else {

                            replaceMentValue[property] = filteredList[noConflict][property];
                        }

                    } //end loop, now add missing keys

                    for (var property in oldList.data[i]) {
                        if (replaceMentValue[property] == undefined) {
                            replaceMentValue[property] = oldList.data[i][property];
                        }
                    }
                    filteredList[noConflict] = replaceMentValue;

                } // end merge values
            } // end check
        }
        if (updates) {
            newList.v = oldList.v + 1;
            newList.v = oldList.v + 1;
            newList.data = filteredList;
        }
        return newList;
    },
    unloadUpdate : function() {
        var response = false;

        if (po_analytics.safeStorage.constants.mode == 'days' && !po_analytics.safeStorage.constants.fired) {
            for (var x in po_analytics.safeStorage.pageCache) {
                if (po_analytics.safeStorage.pageCache[x].updateFlag && po_analytics.safeStorage.pageCache[x].data && po_analytics.safeStorage.pageCache[x].v) {
                    // valid
                    var versionConflict = po_analytics.safeStorage.getItem("now", x);
                    if (versionConflict !== null && versionConflict.v !== undefined) {

                        if (versionConflict.v == po_analytics.safeStorage.pageCache[x].v) {
                            // no conflict, write away
                            po_analytics.safeStorage.pageCache[x].updateFlag = false;
                            po_analytics.safeStorage.write("now", x, po_analytics.safeStorage.pageCache[x].data, true);
                            response = true;
                        } else if (po_analytics.safeStorage.pageCache[x].v < versionConflict.v) {
                            po_analytics.safeStorage.pageCache[x] = po_analytics.safeStorage.resolveVersionConflicts(po_analytics.safeStorage.pageCache[x], versionConflict);
                            po_analytics.safeStorage.write("now", x, po_analytics.safeStorage.pageCache[x].data, true);
                            response = true;

                        } // end behind


                    } else // blank slate, write away
                    {

                        //
                        po_analytics.safeStorage.pageCache[x].updateFlag = false;
                        po_analytics.safeStorage.write("now", x, po_analytics.safeStorage.pageCache[x].data, true);
                        response = true;
                    }

                }

            }
        }
        po_analytics.safeStorage.constants.fired = true;
        return response;

    },
    setUpSession : function() {
        // used to add a session ID
        var ph = po_analytics.safeStorage.getItem("now", "sessionInfo");
        var deleted = false;
        if (ph) {

            var cullDate = po_analytics.safeStorage.expiryDate("sessionInfo");
            if (ph.timestamp !== undefined) {
                if (ph.timestamp < cullDate) {
                    localStorage.removeItem("sessionInfo");
                    // delete key and remove cache.
                    if (po_analytics.safeStorage.pageCache["sessionInfo"]) {
                        delete po_analytics.safeStorage.pageCache["sessionInfo"];
                    }
                    deleted = true;
                } else {
                    // session is current, queue for renew
                    var sessionID = po_analytics.safeStorage.constants.sessionID();
                    po_analytics.safeStorage.write("local", "sessionInfo", {
                        id: sessionID
                    }, true);

                }
            } else {

                deleted = true;
            }
        }
        if (!ph || deleted) {
            var sessionID = [{
                id: po_analytics.support.sessionID()
            }];
            // load into memory

            po_analytics.safeStorage.pageCache["sessionInfo"] = {
                key: po_analytics.safeStorage.constants.key,
                version: po_analytics.safeStorage.constants.version,
                v: 0,
                timestamp: Date.now(),
                data: sessionID
            };
            // write data
            po_analytics.safeStorage.write("now", "sessionInfo", sessionID, true);
        }

    },
    updateItem : function(protocol, identifier, matchKey, keyValue, increment) {
        // Works in three modes that I remember. Increment is an optional value that allows you to just increment a value (or decrement with a negative value) without having to read it first.
        // 1. po_analytics.safeStorage.updateItem("local", products", {colour: "red", section: "mens"}, {tracked: "yes", section: "womens"});
        // Goes through key values and where they match, updates that object. So {productName: "Manchester United Shirt", views: 1, colour: "red", section, "mens", price: 49.99} becomes {productName: "Manchester United Shirt", views: 1, colour: "red", section, "womens", price: 49.99, tracked: "yes"}
        // This doesn't just update the first match - it updates all of them. Idea is you build up a list of things and then fire them all at once.
        // 2. po_analytics.safeStorage.updateItem("local", "products", {productName: "Manchester United Shirt"}, "views", 1);
        // The weak typing in JavaScript means you could also use it to concatenate strings. If you fancy.
        // returns true if updated, false if no updates.
        // 3. po_analytics.safeStorage.updateItem("local", "products", {productName: "Manchester United Shirt"}, "delete");
        // Deletes any keys that match the matckKey.
        // One more quirk. This defaults to the current session in local mode - you don't need to specifiy it.
        // If you want to update matching values across all sessions, set the value of sessionID in your matchKey to false, e.g. po_analytics.safeStorage.updateItem("local","pages", {colour: "red", sessionID: false}, {views: 1})  or  po_analytics.safeStorage.updateItem("local", "pages",{colour: "red", sessionID: false}, "delete")

        var ph = po_analytics.safeStorage.read(protocol, identifier);
        if (keyValue == "delete") {
            var deletePh = JSON.parse(JSON.stringify(ph));
            // create a copy for delete purposes
        }
        matchKey = po_analytics.safeStorage.currentSessionAppend(protocol, matchKey);
        var queryType = (typeof increment === 'undefined');
        var response = false;
        for (var i = 0; i < ph.length; i++) {


            var counter = 0;
            var matches = 0;
            for (var property in matchKey) {

                if (ph[i][property] !== undefined) {
                    counter++;
                    if (ph[i][property] === matchKey[property]) {
                        matches++;
                    }

                }
            }

            if (matches > 0 && matches == counter) {
                if (queryType) {
                    if (keyValue !== "delete") {
                        for (var property in keyValue) {
                            ph[i][property] = keyValue[property];
                            response = true;
                        }
                    } else {
                        delete deletePh[i];
                        response = true;
                    }
                } else {
                    ph[i][keyValue] = ph[i][keyValue] !== undefined ? ph[i][keyValue] + increment : increment;
                    response = true;
                }

            }

        }

        if (response) {
            if (keyValue == "delete") {

                ph = [];
                for (var i = 0; i < deletePh.length; i++) {
                    if (deletePh[i] !== undefined) {
                        ph.push(deletePh[i]);
                    }
                }
            }
            po_analytics.safeStorage.write(protocol, identifier, ph, true);
        }
        return response;
    },
    readItem : function(protocol, identifier, matchKey, key) {
        // reads items in 3 modes
        // 1. po_analytics.safeStorage.readItem("local", "products", {colour: "red", section: "mens"}, "productName")
        // Checks the products value for values matching the keys. Returns an array of the values set for the productName key, e.g. ["Manchester United Shirt", "Liverpool FC Shirt"]
        // 2. po_analytics.safeStorage.readItem("local", "products", {colour: "red", section: "mens"}, "*")
        // Returns entire matching object in array, e.g.
        // [{productName: "Manchester United Shirt", colour: "red", section, "mens", price: 49.99},{productName: "Liverpool FC Shirt", colour: "red", section, "mens", price: 49.99}]
        // To get all matches for the current session, just do po_analytics.safeStorage.readItem("local","products",{},"*")
        // 3. po_analytics.safeStorage.readItem("local", "products", "productName");
        // Returns all values in an array that it holds for that key without needing a match, e.g. ["Manchester United Shirt", "Liverpool FC Shirt", "Everton FC Shirt"]
        // returns false if no results
        //
        // One more quirk. This defaults to the current session in local mode - you don't need to specify it.
        // If you want to return values matching the search across all sessions, set the value of sessionID in your matchKey to false,
        //  e.g. po_analytics.safeStorage.readItem("local","pages", {colour: "red", sessionID: false}, "productName")

        var ph = po_analytics.safeStorage.read(protocol, identifier);
        var queryType = (typeof key !== 'undefined'); // mode 3 requires this undefined
        var response = false;
        var responseData = [];
        matchKey = po_analytics.safeStorage.currentSessionAppend(protocol, matchKey);
        for (var i = 0; i < ph.length; i++) {
            // loop through values to check
            if (queryType) {
                // if it's a query with a defined key - needs an object
                var counter = 0;
                var matches = 0;
                var items = 0; // for empty objects
                for (var property in matchKey) {
                    // loop through match key
                    items++;

                    if (ph[i][property] !== undefined) {
                        counter++;
                        if (ph[i][property] === matchKey[property]) {
                            matches++;
                        }

                    }
                } // end match key loop
                if ((matches > 0 && matches == counter) || items === 0 ) {
                    key == "*" || items === 0 ? responseData.push(ph[i]) : responseData.push(ph[i][key]);
                }

            } else {
                // matchkey can only be  string
                if (ph[i][matchKey] !== undefined) {
                    if ((protocol == "local" || protocol == "now") && identifier != "sessionInfo" && !(matchKey == "id" || matchKey == "sessionID")) {
                        if (ph[i]["sessionID"] == po_analytics.safeStorage.constants.sessionID()) {
                            responseData.push(ph[i][matchKey]);
                        }
                    } else {
                        responseData.push(ph[i][matchKey]);
                    }
                }
            }
        } // end check loop
        if (responseData.length > 0) {
            response = responseData;
        }
        return response;
    },
    read : function(protocol, identifier, defaultValue) {
        // *
        // pulls value from sessionStorage. Protocol is "local" or "session" to denote which storage mechanism to use.
        //Optional parameter allows you to set default value - but it doesn't write this
        var ph = (typeof defaultValue === 'undefined') ? [] : defaultValue;
        var output = po_analytics.safeStorage.getItem(protocol, identifier);

        if (output !== null && output.timestamp !== undefined && output.data) {
            output = output.data;
        }

        return output ? output : ph;
    },
    getItem : function(protocol, identifier) {
        // *
        // used by other functions
        if (protocol == "local" || protocol == "now") {
            if (protocol == "now") {
                var ph = localStorage.getItem(identifier) ? JSON.parse(localStorage.getItem(identifier)) : null;
            } else {
                var ph = po_analytics.safeStorage.pageCache[identifier] ? po_analytics.safeStorage.pageCache[identifier] : null;
            }
        } else ph = JSON.parse(sessionStorage.getItem(identifier));

        return ph;

    },
    setItem : function(protocol, identifier, data) {
        // *
        // used by other functions

        if (protocol == "local" || protocol == "now") {
            var increment = protocol == "now" ? 1 : 0;
            var ph = {
                key: po_analytics.safeStorage.constants.key,
                version: po_analytics.safeStorage.constants.version,
                v: po_analytics.safeStorage.pageCache[identifier] && po_analytics.safeStorage.pageCache[identifier].v ? po_analytics.safeStorage.pageCache[identifier].v + increment : 1,
                ots: po_analytics.safeStorage.pageCache[identifier] && po_analytics.safeStorage.pageCache[identifier].ots ? po_analytics.safeStorage.pageCache[identifier].ots : Date.now(),
                updateFlag: true,
                timestamp: Date.now(),
                data: data.data ? data.data : data
            };
            if (protocol == "now") {
                delete ph.updateFlag;
                localStorage.setItem(identifier, JSON.stringify(ph));
            }
            po_analytics.safeStorage.pageCache[identifier] = ph;
        } else sessionStorage.setItem(identifier, JSON.stringify(data));

    },write : function(protocol, identifier, value, replace) { //begin
        // Writes values to the Storage protocol you select. Replace is optional parameter and defaults to false
        // If replace is false, it appends a new value to the field.
        replace = (typeof replace === 'undefined') ? false : replace;
        if (protocol == "local") {

            po_analytics.safeStorage.constants.fired = false;

        }
        if (replace) {
            var ph = [];
        } else {
            var ph = po_analytics.safeStorage.read(protocol, identifier);
        }
        var ts = Date.now();
        if ((protocol == "local" || protocol == "now")) {

            var currentSession = po_analytics.safeStorage.constants.sessionID();
            var versionIdent = po_analytics.safeStorage.pageCache[identifier] && po_analytics.safeStorage.pageCache[identifier].v ? po_analytics.safeStorage.pageCache[identifier].v + 1 : 1;

        } else {
            var currentSession = 0;
            var versionIdent = 0;

        }

        if (Array.isArray(value)) { // [{test: 1, hello: "there"}, {test: 2, hello: "bye"}]
            for (var i = 0; i < value.length; i++) {
                if (typeof value[i] == "object") {
                    value[i].sessionID = value[i].sessionID ? value[i].sessionID : currentSession;
                    value[i].v = value[i].v ? value[i].v : versionIdent;
                    value[i].ts = value[i].ts ? value[i].ts : ts;
                }
                ph.push(value[i]);

            }
        } else if (typeof value == "object") // {test: 1, hello: "there"}
        {
            value.sessionID = value.sessionID ? value.sessionID : currentSession;
            value.v = value.v ? value.v : versionIdent;
            value.ts = value.ts ? value.ts : ts;
            ph.push(value);

        } else {
            ph.push(value);
        }

        po_analytics.safeStorage.setItem(protocol, identifier, ph);


    },notDuplicate : function(protocol, identifier, matchKey, checkOnly, keyValue) {
        // Checks to see if the value already exists and returns true or false.
        // checkOnly and keyValue are optional parameters
        // checkOnly is true - no updates made, false, it writes the update.
        // keyValue allows you to specify a different update to what you're checking for. E.g.
        // 1. po_analytics.safeStorage.notDuplicate("local", "pages",{colour: "red", product: "Fruit of the Loom T-Shirt"}, false, {colour: "red", product: "Fruit of the Loom T-Shirt", views: 1, userStatus: "not Logged in"}) adds the second object to the pages object if there's no matching value in there with colour "red" and product name "Fruit of the Loom"
        // 2. po_analytics.safeStorage.notDuplicate("local", "pages",{colour: "red", product: "Fruit of the Loom T-Shirt"})
        // Checks if that key exists, same as po_analytics.safeStorage.notDuplicate("pages",{colour: "red", product: "Fruit of the Loom T-Shirt"}, true)
        // 3. po_analytics.safeStorage.notDuplicate("local", pages",{colour: "red", product: "Fruit of the Loom T-Shirt"},false)
        // Checks if values exist, if not writes it and returns true, if it exists, returns false - no writing.
        // One more quirk. notDuplicate defaults to the current session in local mode - you don't need to specifiy it.
        // If you want to de-dupe against all sessions, set the value of sessionID in your matchKey to false, e.g. po_analytics.safeStorage.notDuplicate("local","pages", {colour: "red", sessionID: false}, false, {colour: "red", product: "Fruit of the Loom T-Shirt", views: 1})
        checkOnly = (typeof checkOnly === 'undefined') ? true : checkOnly;
        //matchKey = po_analytics.safeStorage.currentSessionAppend(protocol, matchKey);

        keyValue = (typeof keyValue === 'undefined') ? matchKey : keyValue;


        var checkForValues = po_analytics.safeStorage.readItem(protocol, identifier, matchKey, "*");
        if (checkForValues) {
            return false;
        } else {
            if (!checkOnly) {
                po_analytics.safeStorage.write(protocol, identifier, keyValue);
            }
            return true;
        }
    }, currentSessionAppend : function(protocol, matchKey) {
        if ((protocol == "local" || protocol == "now") && typeof matchKey == "object") {
            if (matchKey.sessionID === undefined) {
                // set current sessionID
                matchKey.sessionID = po_analytics.safeStorage.constants.sessionID();
            } else if (matchKey.sessionID === false) {
                delete matchKey.sessionID;
            }
        }
        return matchKey;

    },expiryDate : function(key) {

        var cullDate = "";
        if (po_analytics.safeStorage.constants.mode == "expire" || key == "sessionInfo") {
            cullDate = Date.now() - (po_analytics.safeStorage.constants.expireTime * 60000);
        } else {
            cullDate = Date.now() - (po_analytics.safeStorage.constants.daysExpire * 1000 * 60 * 60 * 24);
        }
        return cullDate;
    },
    processData : function() {
        // function only called if using localStorage
        for (var key in localStorage) {
            if (key !== "sessionInfo") {
                // loop through keys
                var ph = localStorage[key];
                var deleted = false;

                if (ph.indexOf(po_analytics.safeStorage.constants.key) > -1 && ph.indexOf("timestamp") > -1 && ph.indexOf("}") > -1) {
                    // it's one of ours load
                    ph = JSON.parse(ph);
                    // work out expire date
                    var cullDate = po_analytics.safeStorage.expiryDate(key);
                    if (ph.timestamp !== undefined && ph.timestamp < cullDate) {
                        // delete group, too old
                        localStorage.removeItem(key);
                        deleted = true;

                    }
                    if (po_analytics.safeStorage.constants.mode == "days" && !deleted) {
                        // also need to delete things from old sessions
                        var output = [];
                        var update = false;
                        if (ph.data) {
                            // check for expired stuff
                            for (var i = 0; i < ph.data.length; i++) {
                                if (ph.data[i].sessionID) {
                                    var sessionDate = parseInt(ph.data[i].sessionID.split(".")[0]);
                                    if (sessionDate > cullDate) {
                                        output.push(ph.data[i]);
                                    } else {
                                        update = true;
                                    }

                                }
                            } // end expired check
                            if (update) { // queue data for update
                                if (ph.data.length == 0) {
                                    localStorage.removeItem(key);
                                    deleted = true;
                                } else {
                                    ph.data = output;
                                    ph.updateFlag = true;
                                    ph.timestamp = Date.now();
                                    po_analytics.safeStorage.write("local", key, ph, true);
                                }
                            } else { // no need to queue data for update
                                ph.updateFlag = false;
                            }
                        }
                    }
                    if (!deleted) {
                        ph.ots = Date.now(); // time when loaded
                        po_analytics.safeStorage.pageCache[key] = ph;
                    } else {
                        if (po_analytics.safeStorage.pageCache[key]) {
                            delete po_analytics.safeStorage.pageCache[key];
                        }
                    }
                }
            }
        } // end of key loop
    }
};
