
var po_data = {
    cull: ["basket", "page"],
    enableLocal : false
};

var po_analytics = {
    support: {
        sessionID: function () {
            // generates random session ID. Stored elsewhere.
            return new Date().getTime() + '.' + Math.random().toString(36).substring(5);
        },
        stringToPrice: function (textString) {
            return parseFloat(textString.trim().replace("£", ""));

        },
        squareBrackets: function (strings) {
            // encapsulates array with square brackets
            var output = [], x = "";
            if(Array.isArray(strings))
            {
                for (x = 0; x < strings.length; x++) {
                    output.push("[" + strings[x] + "]");
                }
                return output.join(" ");
            }
            else if(typeof strings === "object")
            {
                for (x in strings) {
                    output.push("[" + strings[x] + "]");
                }
                return output.join(" ");
            }
            else return "[" + strings + "]";

        },
        tagURL : function($container,hash)
        {
            var $url = jQuery($container).find('a');
            $url.each(function() {
                var $item = jQuery(this);
                var url = $item.attr("href");
                $item.attr("href",url+"#"+hash)
            });

        },
        checkout : {
            testComplete: function (selector) {
                var filledIn = true;
                jQuery(selector).each(function () {
                    if (jQuery(this).val().length == 0) {
                        filledIn = false;
                    }

                });
                return filledIn;

            },
            safeMerge : function(container)
            {
                if(container) {
                    var ph = po_analytics.safeStorage.readItem("basket", {id: container.id}, "*");
                    if (ph && ph[0]) {
                        container.brand = ph[0].brand ? ph[0].brand : po_analytics.support.determine.brand(container.name);
                        container.dimension5 = ph[0].dimension5 ? ph[0].dimension5 : undefined;
                        container.dimension6 = ph[0].dimension6 ? ph[0].dimension6 : "Unknown";
                        container.category = ph[0].category ? ph[0].category : "Direct";
                        container.position = ph[0].position ? ph[0].position : 0;
                    }
                }
                return container;

            },
            orderProducts : function()
            {
                var currentBasket = [];
                jQuery('table#checkout-review-table tr[data-sku]').each(function(index) {

                    var $container = jQuery(this);
                    var quantity = parseInt($container.find('.box-qty span.qty').text());
                    var price = po_analytics.support.stringToPrice($container.find('.cart-price span.price').text())/quantity;
                    var product = { id: $container.attr('data-sku'), name: $container.find('h2.product-name').text().trim(), quantity: quantity , price: price  };
                    product = po_analytics.support.checkout.safeMerge(product);
                    currentBasket.push(product);

                });
                return currentBasket;
            },
            buildProducts : function(entries)
            {
                var data = [];
                for(var i=0;i<entries.length;i++)
                {
                    try {
                        var container = {
                            id: entries[i].item_sku,
                            name: entries[i].item_name,
                            price: parseFloat(entries[i].item_price_incl_tax).toFixed(2),
                            quantity: parseInt(entries[i].item_quantity)
                        };
                        try {
                            container = po_analytics.support.checkout.safeMerge(container);
                        }
                        catch(err)
                        {
                            dataLayer.push({"event" : "merge_error", "error_msg" :  po_analytics.support.squareBrackets([err.name,err.message]) });
                        }

                        data.push(container);

                    }

                    catch(err)
                    {
                        dataLayer.push({"event" : "item_error", "error_msg" :  po_analytics.support.squareBrackets([err.name,err.message]) });
                    }



                }
                return data;

            },
            buildTransaction : function()
            {

                if(!window.orderData)
                {

                    dataLayer.push({"event" : "trans_data_missing", "error_msg" : "No variable"});
                    return false;
                }

                if(typeof orderData !== "object")
                {

                    dataLayer.push({"event" : "trans_obj_missing", "error_msg" : "No object"});
                    return false;
                }

                var validate = true, issues = [];

                if(typeof orderData.order_id === 'undefined')
                {
                    issues.push("order_id");
                    validate = false;
                }
                if(typeof orderData.total_order_cost === 'undefined')
                {
                    issues.push("total_order_cost");
                    validate = false;
                }
                if(typeof orderData.shipping_cost === 'undefined')
                {
                    issues.push("shipping_cost");
                    validate = false;
                }
                if(typeof orderData.order_items === 'undefined')
                {
                    issues.push("order_items");
                    validate = false;
                }
                if(typeof orderData.order_items !== "object")
                {
                    issues.push("order_items_object");
                    validate = false;
                }

                if(!validate)
                {
                    dataLayer.push({"event" : "trans_obj_missing_prop", "error_msg" :  po_analytics.support.squareBrackets(issues) });
                    return false;
                }


                var transaction = {
                    purchase: {

                        actionField:
                            {
                                id: window.orderData.order_id,
                                affiliation: window.po_data && po_data.affiliation ? po_data.affiliation : window.location.hostname,
                                revenue: parseFloat(window.orderData.total_order_cost).toFixed(2),
                                shipping: parseFloat(window.orderData.shipping_cost).toFixed(2)
                            }

                    }
                };

                transaction.purchase.products = po_analytics.support.checkout.buildProducts(orderData.order_items);

                if(transaction.purchase.products.length > 0)
                {
                    window.dataLayer.push({
                        "event" : "transaction_complete",
                        "ecommerce" : transaction
                    });
                }

            }

        },
        determine : {
            brand: function (nameString) {
                var brands = window.po_data && po_data.brands ? po_data.brands : [];
                for (var i = 0; i < brands.length; i++) {
                    if (nameString.toLowerCase().indexOf(brands[i].toLowerCase()) > -1) {
                        return brands[i];
                    }

                }
                return "Unknown";

            },
            category: function () {

                var $breadcrumbs = jQuery('.breadcrumbs:first'), $breadcrumbItems = "", vSplit = "";

                $breadcrumbs = $breadcrumbs ? $breadcrumbs : undefined;
                if ($breadcrumbs) {
                    if (!po_analytics.support.isCategory()) {
                        $breadcrumbItems = $breadcrumbs.find('li a');
                        if ($breadcrumbItems.length > 1) {
                            return po_analytics.support.breadcrumbs($breadcrumbItems);
                        }
                    }
                    else {
                        $breadcrumbItems = $breadcrumbs.find('li');
                        if ($breadcrumbItems.length > 1) {
                            return po_analytics.support.breadcrumbs($breadcrumbItems);
                        }

                    }
                }
                var url = window.location.href;
                var blog = "//"+window.location.hostname+"/blog/";

                if(url.split("#")[0].split("?")[0].split("//")[1] === window.location.hostname+"/" || document.referrer.split("#")[0].split("?")[0].split("//")[1] === window.location.hostname+"/")
                {
                    return "@Home";
                }
                if (url.indexOf("catalogsearch/result") > -1) {
                    vSplit = url.indexOf("?q=") > -1 ? "?q=" : "&q=";
                    return "Search Results: " + decodeURIComponent(url.split(vSplit)[1].replace(/\+/g, "%20")).toLowerCase();
                }
                if (document.referrer && document.referrer.indexOf("catalogsearch/result") > -1) {
                    vSplit = document.referrer.indexOf("?q=") > -1 ? "?q=" : "&q=";
                    return "Search Results: " + decodeURIComponent(document.referrer.split(vSplit)[1].replace(/\+/g, "%20")).toLowerCase();
                }
                if (document.referrer && document.referrer.indexOf(blog) > -1) {
                    vSplit = document.referrer.split("#")[0].split("?")[0].split(blog)[1].replace(/\//g, " ").replace('-', " ").trim();
                    return "Blog Post: " + vSplit.toLowerCase();
                }


                return po_analytics.support.determine.unknown();

            },
            unknown : function()
            {
                var response = "*Direct";
                var ref = document.referrer;
                var url = window.location.href.toLowerCase();
                if(url.indexOf("gclid") > -1)
                {
                    response = "*CPC";
                }
                else if(ref.indexOf(".google.c")> -1 || ref.indexOf("bing.c") > -1)
                {
                    response = "*Organic";
                }
                else if(url.indexOf("source=aw") > -1)
                {
                    response = "*Affiliate Window";
                }
                else if(url.indexOf("_bta_tid") > -1)
                {
                    response = "*Bronto";
                }
                else {
                    var ph = po_analytics.safeStorage.readItem('discovery', {id: po_analytics.support.getProductSKU()},"*");
                    if(ph && ph.length>0)
                    {
                        return ph[0].category;
                    }
                }
                return response;
            },
            list : function(category)
            {
                var ref = ["us", "rp", "rc", "picks"];
                var refn = ["Upsells", "Related Products", "Recently Viewed", "Picks of the week"];
                var marker = window.location.href.split("#");
                if(marker && marker[1])
                {
                    var position = ref.indexOf(marker[1]);
                    if(position > -1)
                    {
                        return refn[position];
                    }

                }
                return category.indexOf("Search Results") > -1 ? "Search Results" : category.charAt(0) == '*' ? "Direct" : category == "@Home" ? "Home" : category.indexOf("Blog Post") > -1 ? "Blog" : "Category";
            }
        },
        safeSKU : function($container) {
            var temp = $container.attr('data-sku');
            return temp.length > 0 ? temp : "MISSING";
        },
        cleanBasket : function() {
            var ph = po_analytics.safeStorage.readItem("basket", {}, "*");
            for(var i=0; i<ph.length; i++)
            {
                delete ph[i].list;
                delete ph[i].found;
                delete ph[i].ts;
                delete ph[i].sessionID;

            }
            return ph;
        },
        categoryProduct : function(el,category) {

            var ecommerce = {
                "currencyCode": "GBP", "impressions": []
            };
            jQuery(el).each(function (index) {

                var $container = jQuery(this);
                try {

                    var test = $container.find('a h3.product-title').text();
                    var product = {
                        name: test,
                        id: po_analytics.support.safeSKU($container),
                        price: po_analytics.support.stringToPrice($container.find('div.price').text()),
                        brand: po_analytics.support.determine.brand(test),
                        position: index,
                        list: po_analytics.support.determine.list(category),
                        category: category,
                        dimension6: $container.find('a').attr('href').indexOf('nosto') > -1 ? "Nosto" : "Normal"
                    };
                    if(category=="@Home")
                    {
                        po_analytics.support.tagURL($container,"picks");
                        product.list = "Picks of the week";

                    }
                    ecommerce.impressions.push(product);
                    po_analytics.tracking.constants.pageData.push(product);
                }
                catch (e) {
                    console.log(e.message);
                }

            });

            if(category!=="@Home")
            {
                jQuery('.nosto-block .pod').each(function (index) {
                    try {
                        var $container = jQuery(this);
                        po_analytics.support.tagURL($container,"rc");

                        var test = $container.find('a h3.product-title').text();
                        var product = {
                            name: test,
                            id: po_analytics.support.safeSKU($container),
                            price: po_analytics.support.stringToPrice($container.find('div.price').text()),
                            brand: po_analytics.support.determine.brand(test),
                            position: index,
                            list: "Recently Viewed",
                            category: category,
                            dimension6: $container.find('a').attr('href').indexOf('nosto') > -1 ? "Nosto" : "Normal"
                        };
                        ecommerce.impressions.push(product);
                        po_analytics.tracking.constants.recentData.push(product);
                    }
                    catch (e) {
                        console.log(e.message);
                    }
                });

            }


            return ecommerce;

        },
        extraProduct: function (category, index, $container, list) {
            var test = $container.find('h3').text();
            var $link = $container.find('a');
            var id = po_analytics.support.safeSKU($container);
            var ls = list === "Upsells" ? "us" : "rp";
            po_analytics.support.tagURL($container,ls);

            return {
                "list": list,
                "category": category,
                "position": index,
                "price": po_analytics.support.stringToPrice($container.find('div.price').text()),
                "id" : id,
                "name": test,
                "brand": po_analytics.support.determine.brand(test),
                "dimension6": $link.attr('href').indexOf('nosto') > -1 ? "Nosto" : "Normal"
            };

        },
        cleanURL: function() {

            return window.location.href.split("#")[0].split("?")[0].split(window.location.hostname)[1];
        },
        getProductSKU : function()
        {
            var ph = document.querySelector('div#flint_feefo_product img');
            if(ph !== null)
            {
                return decodeURIComponent(ph.src.split("&vendorref=")[1].split("&")[0]);
            }
            else return false;

        },
        productData: function (category) {

            var currentURL = po_analytics.support.cleanURL();
            var temp = po_analytics.safeStorage.readItem("page", {url: currentURL}, "*");
            if(temp && temp.length > 0)
            {
                temp = temp.pop();
            }

            if(temp)
            {
                delete temp.ts;
                delete temp.sessionID;
                var discovery = po_analytics.safeStorage.readItem("discovery", {name: temp.name}, "*");
                if(discovery && discovery.length > 0)
                {
                    temp.position = discovery[0].position;
                }
                else temp.position = 0;

            }
            else {

                var test = document.querySelector('h1[itemprop=name]').textContent;
                temp = {
                    id: po_analytics.support.getProductSKU(),
                    name: test,
                    price: po_analytics.support.stringToPrice(document.querySelector('div.price-box div.price').textContent),
                    brand: po_analytics.support.determine.brand(test),
                    category: category,
                    list: po_analytics.support.determine.list(category),
                    url: currentURL,
                    position: 0,
                    dimension5: document.querySelector('div[itemprop=availability]').textContent,
                    dimension6: window.location.href.indexOf('nosto') > -1 ? "Nosto" : "Normal"
                };
                po_analytics.safeStorage.notDuplicate("page", {url: currentURL}, false, temp);
                delete temp.url;
            }
            return temp;
        },
        isCategory: function () {
            if (window.po_analytics.tracking.constants.category === undefined) {
                po_analytics.tracking.constants.category = jQuery('body').hasClass('catalog-category-view');
            }
            return po_analytics.tracking.constants.category;

        },
        breadcrumbs  : function($object) {
            var output = [];
            for(var i=1; i<$object.length; i++ )
            {
                output.push($object[i].textContent.replace("/","").trim());
            }
            return output.join("/");

        }

    },
    tracking: {
        constants: {
            device: ('ontouchstart' in document.documentElement) ? 'touchstart' : 'mousedown',
            pageData: [],
            productData: [],
            recentData: [],
            upsellData: [],
            relatedData: [],
            checkOut: [],
            adds : 0,
            steps: ["basket", "checkout", "login or external", "billing address", "delivery address", "delivery method", "payment method", "confirmation"]
        },
        pages: {
            detailClick: function (e) {
                var data = e.data;
                var action = data.type;
                var ecommerce = {
                    click: {
                        actionField: {
                            list: ""
                        },
                        products: []
                    }
                };
                var selector = {
                    "pageData" : '.category-products .grid .pod',
                    "recentData" : '.nosto-block .pod',
                    "upsellData" :  '.upsells .pod:visible',
                    "relatedData" : '.related .pod:visible'
                }, el = "";

                var url = window.location.href;
                if(url.split("#")[0].split("?")[0].split("//")[1] === window.location.hostname+"/")
                {
                    el = '.products .grid .pod';
                }
                else
                {
                    el = selector[action];
                }

                var $container = jQuery(this).closest(el);
                var i = jQuery(el).index($container);

                ecommerce.click.actionField.list = po_analytics.tracking.constants[action][i].list;
                po_analytics.safeStorage.notDuplicate("discovery", {name: po_analytics.tracking.constants[action][i].name}, false, po_analytics.tracking.constants[action][i]);
                delete po_analytics.tracking.constants[action][i].list;
                ecommerce.click.products.push(po_analytics.tracking.constants[action][i]);
                dataLayer.push({"event": "product_click", "ecommerce": ecommerce});

            },
            categorySearchImpression: function () {
                var el = "";
                var category = po_analytics.support.determine.category();
                if(category === "@Home")
                {
                    el =  '.products .grid .pod';
                }
                else {
                    el = '.category-products .grid .pod';
                }

                var ecommerce = po_analytics.support.categoryProduct(el,category);



                dataLayer.push({"event": "product_impression", "ecommerce": ecommerce});

            },
            productImpressionDetail: function () {
                var ecommerce = {
                    "currencyCode": "GBP", "impressions": [], "detail": {
                        actionField : { list : ""},
                        products: []
                    }
                };

                var category = po_analytics.support.determine.category();
                jQuery('.related-products:visible').each(function (index) {
                    try {
                        var product = po_analytics.support.extraProduct(category, index, jQuery(this), "Related Products");
                        ecommerce.impressions.push(product);
                        po_analytics.tracking.constants.relatedData.push(product);
                    }
                    catch (e) {
                        console.log(e.message);
                    }

                });
                jQuery('.upsell-products:visible').each(function (index) {
                    try {
                        var product = po_analytics.support.extraProduct(category, index, jQuery(this), "Upsells");
                        ecommerce.impressions.push(product);
                        po_analytics.tracking.constants.upsellData.push(product);
                    }

                    catch (e) {
                        console.log(e.message);
                    }

                });
                try {
                    var product = po_analytics.support.productData(category);
                    ecommerce.detail.products.push(product);
                    ecommerce.detail.actionField.list = product.list;
                    po_analytics.tracking.constants.productData.push(product);


                }
                catch (e) {
                    console.log(e.message);
                }

                dataLayer.push({"event": "product_impression", "ecommerce": ecommerce});
            },
            addtoBasket: function () {

                po_analytics.tracking.constants.adds++;

                if(po_analytics.tracking.constants.adds > 1)
                {
                    return false;
                }


                var ecommerce = {
                    "currencyCode": "GBP", "add": {
                        actionField: {
                            list: ""
                        },
                        products: []
                    }
                };

                var products = po_analytics.tracking.constants.productData[0];
                products["quantity"] = parseInt(document.querySelector('div#qty-selector input').value);
                var list = products.list;
                if (!po_analytics.safeStorage.notDuplicate("basket", {name: products.name}, false, products)) {
                    po_analytics.safeStorage.updateItem("basket", {name: products.name}, "quantity", products.quantity);
                }
                delete products.list;
                ecommerce.add.products.push(products);
                ecommerce.add.actionField.list = list;
                dataLayer.push({"event": "add_to_basket", "ecommerce": ecommerce});


            },
            checkBasket: function () {


                po_analytics.safeStorage.updateItem("basket", {}, {found: false});
                var ph = po_analytics.safeStorage.readItem("basket", {}, "*");
                po_analytics.tracking.constants.rtCart = [];

                jQuery('li.cart-items').each(function () {

                    var $item = jQuery(this);
                    var product = {
                        name: $item.find('h4.product-name a').text(),
                        id: po_analytics.support.safeSKU($item),
                        price: po_analytics.support.stringToPrice($item.find('span.cart-price span.price').text()),
                        quantity: parseInt($item.find('div.cart-product-qty input.qty:first').val()),
                        found: false
                    };
                    po_analytics.tracking.constants.rtCart.push(product);

                });
                if (po_analytics.tracking.constants.rtCart.length > 0) {

                    for (var i = 0; i < po_analytics.tracking.constants.rtCart.length; i++) {
                        for (var j = 0; j < ph.length; j++) {
                            if (ph[j].name == po_analytics.tracking.constants.rtCart[i].name) {
                                po_analytics.tracking.constants.rtCart[i].found = true;
                                ph[j]["found"] = true;
                                if (ph[j].quantity !== po_analytics.tracking.constants.rtCart[i].quantity) {
                                    po_analytics.tracking.pages.updateBasket(ph[j], po_analytics.tracking.constants.rtCart[i].quantity - ph[j].quantity, "update");
                                    // can be positive, can be negative
                                }
                            }
                        }
                    }
                    for (var i = 0; i < ph.length; i++) {
                        if (typeof ph[i].found !== "undefined" && !ph[i].found) {
                            po_analytics.tracking.pages.updateBasket(ph[i], ph[i].quantity * -1, "delete");
                        }

                    }

                }
                else if (ph) {
                    // empty cart
                    for (var j = 0; j < ph.length; j++) {
                        po_analytics.tracking.pages.updateBasket(ph[j], ph[j].quantity * -1, "delete");
                    }

                }
                for (var i = 0; i < po_analytics.tracking.constants.rtCart.length; i++) {
                    if (!po_analytics.tracking.constants.rtCart[i].found) {
                        po_analytics.tracking.pages.updateBasket(po_analytics.tracking.constants.rtCart[i], po_analytics.tracking.constants.rtCart[i].quantity, "new");
                    }


                }
                var ecommerce = {
                    "checkout": {
                        "actionField": {
                            "step": 1
                        },
                        products: po_analytics.support.cleanBasket()
                    }
                };
                if(ecommerce.checkout.products.length > 0)
                {
                    dataLayer.push({"event": "checkout_po", "ecommerce": ecommerce});
                }


            },


            updateBasket: function (items, quantity, method) {

                var action = quantity > 0 ? "add" : "remove";
                var event = quantity > 0 ? "basket_add" : "basket_remove";

                var ecommerce = {
                    "currencyCode": "GBP"
                };
                delete items.found;
                delete items.sessionID;
                delete items.ts;
                var ph = items.quantity;

                items.category = typeof items.category !== "undefined" ? items.category : "Shopping Basket";
                items.list = typeof items.list !== 'undefined' ? items.list : "Checkout";
                items.position = typeof items.position !== 'undefined' ? items.position : 0;
                items.quantity = quantity > 0 ? quantity : quantity * -1;
                if(items.list == "Checkout")
                {
                    ecommerce[action] = {"products": [items], actionField: {list: items.list}};
                }
                else ecommerce[action] = {"products": [items]};


                var temp = JSON.stringify(ecommerce);
                // cloning because tag manager seems to send wrong quantity
                dataLayer.push({"event": event, "ecommerce": JSON.parse(temp)});

                if (method == "new") {
                    po_analytics.safeStorage.write("basket", items);
                }
                else if (method == "delete") {
                    po_analytics.safeStorage.updateItem("basket", {name: items.name}, "delete");
                }
                else {
                    items.quantity = ph + quantity;
                    po_analytics.safeStorage.updateItem("basket", {name: items.name}, items);
                }

            }


        },
        checkout: {

            backWards: function (step) {
                var i = po_analytics.tracking.constants.checkOut.length, fn = "";
                for (i; i < step; i++) {
                    fn = po_analytics.tracking.checkout.invokeStep(i);
                    fn(true);
                }
            },
            invokeStep: function (step) {
                var outcome = {
                    "basket": po_analytics.tracking.checkout.basketCheckout,
                    "checkout" : po_analytics.tracking.checkout.loaded,
                    "login or external": po_analytics.tracking.checkout.loginOrExternal,
                    "billing address": po_analytics.tracking.checkout.billingAddress,
                    "delivery address": po_analytics.tracking.checkout.deliveryAddress,
                    "delivery method": po_analytics.tracking.checkout.deliveryMethod,
                    "payment method": po_analytics.tracking.checkout.paymentMethod,
                    "confirmation" : po_analytics.tracking.checkout.confirmation
                };
                return outcome[po_analytics.tracking.constants.steps[step]];

            },

            update: function (step, option) {

                if (po_analytics.tracking.constants.checkOut.length < (step - 1)) {
                    po_analytics.tracking.checkout.backWards(step - 1);
                }

                if (po_analytics.tracking.constants.checkOut.length >= step) {
                    return false;
                }

                var ecommerce = {
                    "checkout": {
                        "actionField": {
                            "step": step
                        },
                        products : po_analytics.support.checkout.orderProducts()
                    }
                };
                if (typeof option !== "undefined") {
                    ecommerce.checkout.actionField.option = option;
                }

                dataLayer.push({
                    event: "checkout_po", ecommerce: ecommerce
                });

                po_analytics.tracking.constants.checkOut.push(po_analytics.tracking.constants.steps[step - 1]);

            },
            loaded : function() {
                // step 1 = basket
                // step 2 = checkout loaded
                po_analytics.tracking.checkout.update(2);
                // bindings
                // step 3
                jQuery(document).on("click",'form[id="onestepcheckout-login-form"] button', po_analytics.tracking.checkout.loginTrack);
                // step 4
                jQuery(document).on("change", 'div.billing_address input.required-entry', po_analytics.tracking.checkout.billingAddress);

                //step 5 is defined by step 6 beginning

                // step 6
                jQuery(document).on('click', '.order-information span.outer', po_analytics.tracking.checkout.deliveryMethod);
                // step 7
                jQuery(document).on("click", 'div#onestepcheckout-payment-methods dt', po_analytics.tracking.checkout.paymentMethod);
                // step 8
                jQuery(document).on("click", 'button#onestepcheckout-button-place-order', po_analytics.tracking.checkout.confirmation);


            },
            loginTrack: function () {
                po_analytics.tracking.constants.loggedIn = true;
                po_analytics.tracking.checkout.loginOrExternal();
            },

            loginOrExternal: function (e) {
                //var force = typeof e === "undefined" || typeof e === "object" ? false : e;
                if (typeof po_analytics.tracking.constants.loggedIn !== "undefined" && po_analytics.tracking.constants.loggedIn) {
                    po_analytics.tracking.checkout.update(3, "Login");
                }
                else {
                    po_analytics.tracking.checkout.update(3, "Guest");
                }
            },
            billingAddress: function (e) {
                var force = typeof e === "undefined" || typeof e === "object" ? false : e;
                var filledIn = po_analytics.support.checkout.testComplete('div.billing_address input[type=text].required-entry');
                if (filledIn || force) {
                    po_analytics.tracking.checkout.update(4, jQuery('div.billing_address li.country select option:selected').text().trim());
                }
            },
            deliveryAddress: function (e) {
                var force = typeof e === "undefined" || typeof e === "object" ? false : e;
                var option = jQuery('li.shipping_other_address input').is(":checked") || !jQuery('div.shipping_address').is(":visible") ? "Same Address" : "Different";
                var filledIn = po_analytics.support.checkout.testComplete('div.shipping_address input[type=text].required-entry');

                if (filledIn || force) {
                    po_analytics.tracking.checkout.update(5, option);
                }

            },
            basketCheckout: function () {
                // no update as step already sent
                po_analytics.tracking.constants.checkOut.push(po_analytics.tracking.constants.steps[0]);
            },
            deliveryMethod: function (e) {
                var force = typeof e === "undefined" || typeof e === "object" ? false : e;
                var $ph = jQuery('.order-information input:checked'), result = "";
                if ($ph.length > 0) {
                    result = $ph.closest('label').attr("for").replace("s_method_premiumrate_", "").replace("s_method_flatrate_").replace(/_/g, " ");
                }
                else if (force) {
                    result = "Skipped";
                }

                if (result.length > 0) {
                    po_analytics.tracking.checkout.update(6, result);
                }
            },
            paymentMethod: function (e) {
                var force = typeof e === "undefined" || typeof e === "object" ? false : e;
                var option = jQuery('li.payment-method input[name="payment[method]"]:checked').attr('title');
                var filledIn = po_analytics.support.checkout.testComplete('li.payment-method ul.form-list input.required-entry:visible');

                if (filledIn || force) {
                    po_analytics.tracking.checkout.update(7, option);
                }

            },
            confirmation: function() {

                var option = jQuery('div.onestepcheckout-newsletter input[type=checkbox]').is(":checked") ?  "Newsletter" : "No Newsletter";
                if(po_analytics.tracking.constants.checkOut.length >= 7 || po_analytics.support.checkout.testComplete('li.payment-method ul.form-list input.required-entry:visible'))
                {
                    po_analytics.tracking.checkout.update(8, option);
                }

            }

        }
    }
};


po_analytics.safeStorage = {

    constants: {
        cull: window.po_data && po_data.cull ? po_data.cull : [],
        enableLocal : window.po_data && typeof po_data.enableLocal !== "undefined" ? po_data.enableLocal : true,
        expireTime: window.po_data && po_data.expireTime ? po_data.expireTime : 30,
        daysExpire: window.po_data && po_data.daysExpire ? po_data.expireTime : 120,
        key: "43534534BZZJ",
        sessionID: function () {
            if (po_analytics.tracking.constants.sessionID === undefined || po_analytics.tracking.constants.timestamp < po_analytics.safeStorage.expiryDate("sessionInfo")) {
                po_analytics.safeStorage.setUpSession();
            }
            return po_analytics.tracking.constants.sessionID;
        }

    },
    setUpSession: function () {
        var ph = po_analytics.safeStorage.getItem("sessionInfo");
        var deleted = false;
        if (ph) {

            var cullDate = po_analytics.safeStorage.expiryDate("sessionInfo");
            if (ph.timestamp !== undefined) {
                if (ph.timestamp < cullDate) {
                    po_analytics.safeStorage.removeItem("sessionInfo");
                    delete po_analytics.tracking.constants.sessionID;
                    delete po_analytics.tracking.constants.timestamp;
                    deleted = true;
                } else {
                    // session is current, queue for renew
                    var sessionID = ph.data[0].id;
                    po_analytics.tracking.constants.sessionID = sessionID;
                    po_analytics.tracking.constants.timestamp = Date.now();
                    po_analytics.safeStorage.write("sessionInfo", {
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
            po_analytics.tracking.constants.sessionID = sessionID[0].id;
            po_analytics.tracking.constants.timestamp = Date.now();
            po_analytics.safeStorage.write("sessionInfo", sessionID, true);
            for (var i = 0; i < po_analytics.safeStorage.constants.cull.length; i++) {
                // remove data not needed cross-session
                po_analytics.safeStorage.removeItem(po_analytics.safeStorage.constants.cull[i]);

            }

        }

    },
    expiryDate: function () {

        return Date.now() - (po_analytics.safeStorage.constants.expireTime * 60000);
    },
    testLocal: function () {
        if(!po_analytics.safeStorage.constants.enableLocal)
        {
            po_analytics.safeStorage.constants.localStorage = false;
        }
        if (window.po_analytics.safeStorage.constants.localStorage === undefined) {
            var uid = new Date;
            var result;
            try {
                localStorage.setItem(uid, uid);
                result = localStorage.getItem(uid) == uid;
                localStorage.removeItem(uid);
                po_analytics.safeStorage.constants.localStorage = true;
            }
            catch (exception) {
                po_analytics.safeStorage.constants.localStorage = false;
            }

        }
        return po_analytics.safeStorage.constants.localStorage;
    },
    initialise: function () {

        if (po_analytics.safeStorage.testLocal()) {
            po_analytics.safeStorage.setUpSession();
        }
        else po_analytics.safeStorage.setUpSession();

    },
    getItem: function (identifier) {
        // *
        // used by other functions
        var ph = false, temp = "";
        if (po_analytics.safeStorage.testLocal()) {

            temp = localStorage.getItem(identifier);
            ph =  temp ? JSON.parse(decodeURIComponent(temp)) : null;
        }
        else {
            temp = po_analytics.cookies.read("__"+identifier);
            ph = temp !== null ? JSON.parse(decodeURIComponent(temp)) : null;
        }
        return ph;

    },
    removeItem : function(identifier) {
        if (po_analytics.safeStorage.testLocal()) {
            localStorage.removeItem(identifier);
        }
        else {
            po_analytics.cookies.erase("__"+identifier);
        }

    },
    setItem: function (identifier, data) {
        // *
        // used by other functions
        var ph = {
            key: po_analytics.safeStorage.constants.key,
            timestamp: Date.now(),
            data: data.data ? data.data : data
        };

        if (po_analytics.safeStorage.testLocal()) {
            localStorage.setItem(identifier, encodeURIComponent(JSON.stringify(ph)));
        }
        else {
            po_analytics.cookies.create("__"+identifier,encodeURIComponent(JSON.stringify(ph)));
        }

    },
    read: function (identifier, defaultValue) {
        // *
        var ph = (typeof defaultValue === 'undefined') ? [] : defaultValue;
        var output = po_analytics.safeStorage.getItem(identifier);

        if (output !== null && output.timestamp !== undefined && output.data) {
            output = output.data;
        }

        return output ? output : ph;
    },
    write: function (identifier, value, replace) { //begin

        // Writes values to the Storage protocol you select. Replace is optional parameter and defaults to false
        // If replace is false, it appends a new value to the field.
        replace = (typeof replace === 'undefined') ? false : replace;
        if (replace) {
            var ph = [];
        } else {
            var ph = po_analytics.safeStorage.read(identifier);
        }
        var ts = Date.now();
        var currentSession = po_analytics.safeStorage.constants.sessionID();


        if (Array.isArray(value)) { // [{test: 1, hello: "there"}, {test: 2, hello: "bye"}]
            for (var i = 0; i < value.length; i++) {
                if (typeof value[i] == "object") {
                    value[i].sessionID = value[i].sessionID ? value[i].sessionID : currentSession;
                    value[i].ts = value[i].ts ? value[i].ts : ts;
                }
                ph.push(value[i]);

            }
        }
        else if (typeof value == "object") // {test: 1, hello: "there"}
        {
            value.sessionID = value.sessionID ? value.sessionID : currentSession;
            value.ts = value.ts ? value.ts : ts;
            ph.push(value);

        } else {
            ph.push(value);
        }

        po_analytics.safeStorage.setItem(identifier, ph);

    },
    currentSessionAppend: function (matchKey) {
        if (typeof matchKey == "object") {
            if (matchKey.sessionID === undefined) {
                // set current sessionID
                matchKey.sessionID = po_analytics.safeStorage.constants.sessionID();
            } else if (matchKey.sessionID === false) {
                delete matchKey.sessionID;
            }
        }
        return matchKey;

    },
    updateItem: function (identifier, matchKey, keyValue, increment) {

        var ph = po_analytics.safeStorage.read(identifier);
        if (keyValue == "delete") {
            var deletePh = JSON.parse(JSON.stringify(ph));
            // create a copy for delete purposes
        }
        matchKey = po_analytics.safeStorage.currentSessionAppend(matchKey);
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
            po_analytics.safeStorage.write(identifier, ph, true);
        }
        return response;
    },
    readItem: function (identifier, matchKey, key) {
        var ph = po_analytics.safeStorage.read(identifier);
        var queryType = (typeof key !== 'undefined');
        var response = false;
        var responseData = [];
        matchKey = po_analytics.safeStorage.currentSessionAppend(matchKey);
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
                if ((matches > 0 && matches == items) || items === 0) {
                    if (key == "*" || items === 0) {
                        responseData.push(ph[i]);
                    }
                    else if (ph[i][key] !== undefined) {
                        responseData.push(ph[i][key]);
                    }

                }

            } else {
                // matchkey can only be  string
                if (ph[i][matchKey] !== undefined) {
                    if (identifier != "sessionInfo" && !(matchKey == "id" || matchKey == "sessionID")) {
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
    notDuplicate: function (identifier, matchKey, checkOnly, keyValue) {
        checkOnly = (typeof checkOnly === 'undefined') ? true : checkOnly;
        keyValue = (typeof keyValue === 'undefined') ? matchKey : keyValue;

        var checkForValues = po_analytics.safeStorage.readItem(identifier, matchKey, "*");
        if (checkForValues) {
            return false;
        } else {
            if (!checkOnly) {
                po_analytics.safeStorage.write(identifier, keyValue);
            }
            return true;
        }
    }

};

po_analytics.cookies = {
    data: {
        domain: window.po_data && po_data.cookieDomain ? po_data.cookieDomain : ("^" + window.location.hostname).replace("^www.", "").replace("^", "")
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
    }
};



po_analytics.safeStorage.initialise();
