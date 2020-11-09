var CONTEXTCOLOR = "yellow"
var NEGCOLOR = "red"
var POSCOLOR = "lightgreen"
var NEUCOLOR = "lightgray"
var prevContextStart = 0;
var prevContextEnd = 0;
var FLASHDURATION = 50;
var ALERTCOLOR = "red";
alltaglocs = []

function setprevContextStart(num){
    prevContextStart = num;
    console.log("prevConStrt set to ", prevContextStart);
}

function setprevContextEnd(num){
    prevContextEnd = num;
    console.log("prevConEnd set to ", prevContextEnd);
    console.log("Contextstrt-end now [" + document.body.innerHTML.substring(prevContextStart, prevContextEnd) + "]");
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    console.log(request.action + " " + request.highlighted);
    var HL = request.highlighted.trim();

    if (request.action == "con") {
      addContext(HL);
    } else if (request.action == "pos"){
        addPos(HL);
    } else if (request.action == "neu"){
        addNeu(HL);
    } else if (request.action == "neg"){
        addNeg(HL);
    } else if (request.action == "und"){
        undo();
    } else if (request.action == "not"){
        notify(HL);
    } else {
        console.log(request.action + " not found.");
    }
    console.log("Contextstrt-end now [" + document.body.innerHTML.substring(prevContextStart, prevContextEnd) + "]");
  });


function notify() {
    var oldcolor = document.body.style.backgroundColor;
    innernotify(oldcolor);
    setTimeout(function() {innernotify(oldcolor)}, FLASHDURATION+60);
    setTimeout(function() {innernotify(oldcolor)}, 2*FLASHDURATION+70);
    setTimeout(function() {revertscreen(oldcolor)}, 3*FLASHDURATION+80);
};

function innernotify(oldcolor){
    flashscreen();
    console.log("flashed");
    setTimeout(function() {revertscreen(oldcolor)}, FLASHDURATION);
    console.log('done');
};

function flashscreen(){
    document.body.style.backgroundColor = ALERTCOLOR;
};

function revertscreen(color){
    document.body.style.backgroundColor = color;
};

function markS(color){
    var builtstring = " <mark id=\"JSVCS\" style=\"background-color:" + color + "\"> ";
    setprevContextEnd(prevContextEnd + builtstring.length)
    console.log("strtmark len", builtstring.length)
    return builtstring;
};

function markE(){
    var builtstring = " </mark> ";
    setprevContextEnd(prevContextEnd + builtstring.length)
    console.log("endmark len", builtstring.length)
    return [builtstring, builtstring.length];
};

function highlightInside(body, starttag, endtag){
       for(var ch_i =0; ch<body.length; ch++){
        var ch = body[ch_i];

    }
}

function highlight(color, start, end, body){
    var prefix      = body.substring(0, start);
    var starttag    = markS(color);
    var mid         = body.substring(start, end);
    var endtag      = markE();
    var suffix      = body.substring(end);


    // highlight everythign until you hit an end tag, and then recall this same function for substring after that tag
    var newbody = prefix + starttag + rest + endtag + suffix


}

function addContext(highlighted){
    var body = document.body.innerHTML;
    console.log("CONTEXT finding [" + highlighted + "]");
    try{
        var [start, end] = htmlsearchRecursive(highlighted, body);
    } catch (e){
        alltaglocs.push([[0,0], [0,0]]);
        return;
    }

    setprevContextStart(start);
    setprevContextEnd(end);
    var smark = markS(CONTEXTCOLOR);
    var emark = markE();
    var newbody = body.substring(0, start) + smark[0] + body.substring(start, end) + emark[0] + body.substring(end);

    document.body.innerHTML = newbody;
    alltaglocs.push([ [start, start+smark[1] ] ,[ end+smark[1], end+smark[1]+emark[1]] ])

};

function addCol(highlighted, color){
    var body = document.body.innerHTML;
    console.log("finding " + highlighted + " on indexes " + prevContextStart.toString() + " : " + prevContextEnd.toString() + " in ["+
                body.substring(prevContextStart, prevContextEnd) + "] .")
    var offsets = htmlsearchRecursive(highlighted, body.substring(prevContextStart, prevContextEnd));
    console.log("offsets ", offsets);
    var start = prevContextStart + offsets[0];
    var end = start + offsets[1];
    console.log("start end ", start, end);

    var smark = markS(color);
    var emark = markE();
    var newbody = body.substring(0, prevContextStart) + smark[0] + body.substring(start, end) + emark[0] + body.substring(prevContextEnd);

    alltaglocs.push([ [start, start+smark[1] ] , [ end+smark[1], end+smark[1]+emark[1] ] ])
    document.body.innerHTML = newbody;
};

function addPos(highlighted) {
    addCol(highlighted, POSCOLOR);
};

function addNeg(highlighted) {
    addCol(highlighted, NEGCOLOR);
};

function addNeu(highlighted) {
    addCol(highlighted, NEUCOLOR);
};

function undo() {
    var body = document.body.innerHTML;
    var toremove = alltaglocs.pop();
    var first = toremove[0];
    var second = toremove[1];
    var newbody = body.substring(0, first[0]) + body.substring(first[1], second[0]) + body.substring(second[1]);
    document.body.innerHTML = newbody;
    setprevContextEnd(prevContextEnd - (first[1]-first[0]) - (second[1] - second[0]));
};


function searchinner(lostboy, context){
    if (!lostboy) {
        return 1;
    }
    if (!context) {
        return -1;
    }
    var i = 0;
    var stuck = true;
    while(stuck) {
        if (i > context.length)
            return -1;

        stuck = false;
        if (/\s/.test(context[i])) {
            stuck = true;
            i += 1;
        }
        if (context[i] == '<') {
            while (context[i] != '>') {
                stuck = true;
                i+=1;
            }
        i += 1;
        }
    }

    if (lostboy[0] === context[i]){

        ret = searchinner(lostboy.substring(1), context.substring(i+1));
        if (ret == -1){
            return -1;
        } else {
            return ret + 1 + i;
        }
    }
    return -1;
};


function htmlsearchRecursive(lostboy, context) {
    lostboy = lostboy.replace(/\s/g,'');
    for (var cc = 0; cc < context.length; cc++){
        if (lostboy[0] == context[cc]) {
            var ret = searchinner(lostboy.substring(1), context.substring(cc+1));
            if (ret == -1){
                continue
            } else {
                return [cc, cc+ret];
            }
        }
    }
    return -1;
};


function htmlsearch(lostboy, context){
    var ctxj;

    // for each letter in context
    for (var ctxi = 0; ctxi < context.length - lostboy.length; ctxi++) {
        if (ctxi > (context.length - lostboy.length)){
            return -1;
        }

        // if first letters aren't the same, continue to next cycle
        if (context[ctxi] !== lostboy[0]){
            continue;
        }
        ctxj = ctxi;

        // for character in lostboy
        for (var lbi = 0; lbi < lostboy.length; lbi++, ctxj++) {

            // make sure first isn't a whitespace
            if (!lostboy[lbi].trim()){
               ctxj--;
               continue;
            }
            var stuck = true;

            // remove all internal whitespaces and tags from context
            while (stuck) {
                stuck = false;
                if (!context[ctxj].trim()){
                   ctxj++;
                   stuck = true;
                   continue;
                }
                if (context[ctxj] == '<'){
                    stuck = true;
                    while(context[ctxj] != '>'){
                        ctxj++;
                    }
                    ctxj++;
                }
            }

            if (context[ctxj] != lostboy[lbi]) {
                break;
            }
        }
        if (lbi == lostboy.length){
            console.log([ctxi, ctxj])
            return [ctxi, ctxj];  // found at ctxi
        }
    }
    return -1;
};
  // htmlsearch("Grund zur Moderation.", " Grund zur<br>Moderation.  ");


function test(what){
var b = document.body.innerHTML;

var t0 = performance.now();
var res = b.search(what);
console.log('searchn ',performance.now()-t0, " ms, ", res);

if (res != -1) { console.log(b.substring(res, res+what.length));}

var t0 = performance.now();
var res = htmlsearch(what, b);
console.log('charles ',performance.now()-t0, " ms, ", res);
if (res[0] != -1) { console.log(b.substring(res[0], res[1]));}

var t0 = performance.now();
var res = htmlsearchRecursive(what,b);
console.log('minerec ',performance.now()-t0, " ms, ", res);
if (res[0] != -1) { console.log(b.substring(res[0], res[1]));}
};
