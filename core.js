var po_analytics = po_analytics ? po_analytics : {};


po_analytics.safeStorage = {

  constants: {
    version: 1,
    expireTime: window.po_data && po_data.expireTime ? po_data.expireTime : 30,
    daysExpire: window.po_data && po_data.daysExpire ? po_data.expireTime : 120,
    key: "43534534BZZJ",
    sessionID: function() {
      return po_analytics.safeStorage.readItem("local", "sessionInfo", "id")[0];
    },
    mode: window.po_data && po_data.mode ? po_data.mode : "days"
      // other value is "expire"
  },
  setUpSession: function() {
    // used to add a session ID
    if (localStorage["sessionInfo"]) {
      var ph = JSON.parse(localStorage["sessionInfo"]) ? JSON.parse(localStorage["sessionInfo"]) : {};
      if (ph.timestamp !== undefined) {
        if ((Date.now() - ph.timestamp) > po_analytics.safeStorage.constants.expireTime * 60000) {
          localStorage.removeItem("sessionInfo");
        } else {
          var sessionID = po_analytics.safeStorage.readItem("local", "sessionInfo", "id")[0];
          po_analytics.safeStorage.write("local", "sessionInfo", {
            id: sessionID
          }, true);
        }
      }
    } else {

      po_analytics.safeStorage.write("local", "sessionInfo", {
        id: po_analytics.support.sessionID()
      }, true);

    }
  },

  initialise: function() {
    // clears data that hasn't been updated in the last expireTime minutes
    // This module will need to be initialised before at least the cookie module
    
    po_analytics.safeStorage.setUpSession();

    for (var key in localStorage) {
      var ph = localStorage[key];
      if (po_analytics.safeStorage.constants.mode == "expire") {
        if (ph.indexOf(po_analytics.safeStorage.constants.key) > -1 && ph.indexOf("timestamp") > -1 && ph.indexOf("}") > -1) {
          ph = JSON.parse(ph);
          if (ph.timestamp !== undefined && (Date.now() - ph.timestamp) > po_analytics.safeStorage.constants.expireTime * 60000) {
            localStorage.removeItem(key);
          }
        }
      } else {
        if (ph.indexOf(po_analytics.safeStorage.constants.key) > -1 && ph.indexOf("timestamp") > -1 && ph.indexOf("}") > -1) {
          ph = po_analytics.safeStorage.readItem("local", key, "sessionID");
          var deleteList = {};
          for (var i = 0; i < ph.length; i++) {
            var datePh = parseInt(ph[i].split(".")[0]) + (po_analytics.safeStorage.constants.daysExpire * 1000 * 60 * 60 * 24);
            if (Date.now() > datePh) {
              deleteList[ph[i]] = 1;
            }
          }

          //
          for (var session in deleteList) {

            po_analytics.safeStorage.updateItem("local", key, {
              sessionID: session
            }, "delete");

          }

        }

      }

    }
  },
  setItem: function(protocol, identifier, data) {
    // used by other functions
    if (protocol == "local") {
      var ph = {
        key: po_analytics.safeStorage.constants.key,
        version: po_analytics.safeStorage.constants.version,
        timestamp: Date.now(),
        data: data
      }
      localStorage.setItem(identifier, JSON.stringify(ph));
    } else sessionStorage.setItem(identifier, JSON.stringify(data));

  },
  getItem: function(protocol, identifier) {
    // used by other functions
    if (protocol == "local") {
      var ph = localStorage.getItem(identifier) ? JSON.parse(localStorage.getItem(identifier)) : null;
      if (ph !== null && ph.timestamp !== undefined && ph.data) {
        ph = ph.data;
      }

    } else ph = JSON.parse(sessionStorage.getItem(identifier));

    return ph;
  },
  read: function(protocol, identifier, defaultValue) {
    // pulls value from sessionStorage. Protocol is "local" or "session" to denote which storage mechanism to use.
    //Optional parameter allows you to set default value - but it doesn't write this
    var ph = (typeof defaultValue === 'undefined') ? [] : defaultValue;
    var output = po_analytics.safeStorage.getItem(protocol, identifier);
    return output ? output : ph;
  },
  readItem: function(protocol, identifier, matchKey, key) {
    // reads items in 3 modes 
    // 1. po_analytics.safeStorage.readItem("session", "products", {colour: "red", section: "mens"}, "productName")
    // Checks the products value for values matching the keys. Returns an array of the values set for the productName key, e.g. ["Manchester United Shirt", "Liverpool FC Shirt"]
    // 2. po_analytics.safeStorage.readItem("session", "products", {colour: "red", section: "mens"}, "*")
    // Returns entire matching object in array, e.g. [{productName: "Manchester United Shirt", colour: "red", section, "mens", price: 49.99},{productName: "Liverpool FC Shirt", colour: "red", section, "mens", price: 49.99}]
    // 3. po_analytics.safeStorage.readItem("local", "products", "productName");
    // Returns all values in an array that it holds for that key without needing a match, e.g. ["Manchester United Shirt", "Liverpool FC Shirt", "Everton FC Shirt"]
    // returns false if no results
    // One more quirk. This defaults to the current session in local mode - you don't need to specifiy it. 
    // If you want to return values matching the search across all sessions, set the value of sessionID in your matchKey to false, e.g. po_analytics.safeStorage.readItem("local","pages", {colour: "red", sessionID: false}, "productName")        
    var ph = po_analytics.safeStorage.read(protocol, identifier);
    var queryType = (typeof key === 'undefined') ? false : true;
    var response = false;
    var responseData = [];
    matchKey = po_analytics.safeStorage.currentSessionAppend(protocol, matchKey);
    for (var i = 0; i < ph.length; i++) {
      if (queryType) {
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
          key == "*" ? responseData.push(ph[i]) : responseData.push(ph[i][key]);
        }

      } else {
        if (ph[i][matchKey] !== undefined) {
          if (protocol == "local" && identifier != "sessionInfo" && matchKey != "id") {
            if (ph[i]["sessionID"] == po_analytics.safeStorage.constants.sessionID()) {
              responseData.push(ph[i][matchKey]);
            }
          } else responseData.push(ph[i][matchKey]);
        }
      }
    }
    if (responseData.length > 0) {
      response = responseData;
    }
    return response;
  },
  updateItem: function(protocol, identifier, matchKey, keyValue, increment) {
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
    }
    matchKey = po_analytics.safeStorage.currentSessionAppend(protocol, matchKey);
    var queryType = (typeof increment !== 'undefined') ? false : true;
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
        po_analytics.safeStorage.write(protocol, identifier, ph, true);
      }
    }
    return response;
  },
  notDuplicate: function(protocol, identifier, matchKey, checkOnly, keyValue) {
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
  },
  write: function(protocol, identifier, value, replace) {
    // Writes values to the Storage protocol you select. Replace is optional parameter and defaults to false
    // If replace is true, it overwrites the existing values - this is how you edit data using the updateItem command
    // If replace is false, it appends a new value to the field.  
    var check = (typeof replace === 'undefined') ? false : replace;
    if (check) {
      if (!Array.isArray(value)) {
        value = [value];
      }
      po_analytics.safeStorage.setItem(protocol, identifier, value);
    } else {
      var ph = po_analytics.safeStorage.read(protocol, identifier);
      if (protocol == "local" && typeof value == "object") {
        value.sessionID = po_analytics.safeStorage.constants.sessionID();
      }
      ph.push(value);
      po_analytics.safeStorage.setItem(protocol, identifier, ph);
    }
  },
  currentSessionAppend: function(protocol, matchKey) {
    if (protocol == "local" && typeof matchKey == "object") {
      if (matchKey.sessionID === undefined) {
        // set current sessionID 
        matchKey.sessionID = po_analytics.safeStorage.constants.sessionID();
      } else if (matchKey.sessionID === false) {
        delete matchKey.sessionID;
      }
    }
    return matchKey;

  }
};

po_analytics.support = {
// just support functions I tend to use in setups - although the session ID function is needed for the above.
  cleanURL: function(pageOnly) {
    // gets the URL and cleans it.By default, strips out some common URL parameters. Optional parameter pageOnly. Set it to anything to include the domain and protocol.
    pageOnly = (typeof pageOnly === 'undefined') ? true : false;
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
  sessionID: function() {
    // generates random session ID. Stored elsewhere. 
    return new Date().getTime() + '.' + Math.random().toString(36).substring(5);
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
      var ph = {};
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
  safePush: function(item, value) {
    // kind of redundant. Being phased out
    if (typeof po_analytics.stats[item] == "undefined") {
      po_analytics.stats[item] = [];
    }
    po_analytics.stats[item].push(value);
  },
  safePull: function(item) {
    // as above
    if (typeof po_analytics.stats[item] == "undefined") {
      return [];
    } else return po_analytics.stats[item];
  },
  toTitleCase: function(str) {
    // proper cases text.
    return str.replace(/\w\S*/g, function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  },
}




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


}
