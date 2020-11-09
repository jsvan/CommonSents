var CONTEXTCOLOR = "yellow"
var NEGCOLOR = "red"
var POSCOLOR = "lightgreen"
var NEUCOLOR = "lightgray"
var prevContextStart = 0;
var prevContextEnd = 0;
var FLASHDURATION = 50;
var ALERTCOLOR = "red";
var WARNINGCOLOR = "yellow";
alltaglocs = []

function setprevContextStart(num){
    prevContextStart = num;
    console.log("prevConStrt set to ", prevContextStart);
}

function setprevContextEnd(num){
    prevContextEnd = num;
    console.log("prevConEnd set to ", prevContextEnd);
    // console.log("Contextstrt-end now [" + document.body.innerHTML.substring(prevContextStart, prevContextEnd) + "]");
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    console.log(request.action + " " + request.highlighted);
    var HL = request.highlighted.trim();

    if (request.action == "CON") {
      addContext(HL);
    } else if (request.action == "POS"){
        addPos(HL);
    } else if (request.action == "NEU"){
        addNeu(HL);
    } else if (request.action == "NEG"){
        addNeg(HL);
    } else if (request.action == "UND"){
        undo();
    } else if (request.action == "NOT"){
        notify(ALERTCOLOR);
    } else {
        console.log(request.action + " not found.");
    }
    // console.log("Contextstrt-end now [" + document.body.innerHTML.substring(prevContextStart, prevContextEnd) + "]");
  });


function notify(color) {
    var oldcolor = document.body.style.backgroundColor;
    innernotify(color, oldcolor);
    setTimeout(function() {innernotify(color, oldcolor)}, FLASHDURATION+60);
    setTimeout(function() {innernotify(color, oldcolor)}, 2*FLASHDURATION+70);

    setTimeout(function() {revertscreen(oldcolor)}, 3*FLASHDURATION+80);
};

function innernotify(color, oldcolor){
    flashscreen(color);
    console.log("flashed");
    setTimeout(function() {revertscreen(oldcolor)}, FLASHDURATION);
    console.log('done');
};

function flashscreen(color){
    document.body.style.backgroundColor = color;
};

function revertscreen(oldcolor){
    document.body.style.backgroundColor = oldcolor;
};

function markS(color){
    var builtstring = " <mark style=\"background-color:" + color + "\"> ";
    return builtstring;
};

function markE(){
    var builtstring = " </mark> ";
    return builtstring;
};


function highlightInside(mid, starttag, endtag, startLocOffset){
    function Tag(){
        this.taglocs = [];
        this.addedtagwidth = 0;
        this.push = function(tag, where){
            var tagstartloc = where + this.addedtagwidth + startLocOffset;
            console.log("ADDING ", tag, " AT [", tagstartloc, tagstartloc+tag.length,"]");
            this.taglocs.push([tagstartloc, tagstartloc + tag.length]);
            this.addedtagwidth += tag.length;
        }
    }

    var finalhtmllist = [];
    finalhtmllist.push(starttag);
    taginfo = new Tag();
    taginfo.push(starttag, 0);

    var inTag = false;
    var inMark = true;
    for(var ch_i = 0; ch_i<mid.length; ch_i++){
        var ch = mid[ch_i];
        if ( ch === '<' && inMark){
            inTag = true;
            finalhtmllist.push(endtag);
            taginfo.push(endtag, ch_i);
            inMark = false;
        } else if ( inTag && ch === '>') {
            inTag = false;
        } else if (inTag || /\s/.test(ch) ) {  // if in a tag or is a whitespace
            // pass to just add it
        } else if (ch === '<' && !inMark){
            inTag = true;

        } else if (!inMark) {  //Havent begun mark yet, not inTag.
            console.log("ADDING MARK ["+ch+"]", mid.substring(ch_i-10, ch_i+10) );
            finalhtmllist.push(starttag);
            taginfo.push(starttag, ch_i);
            inMark = true;
        }
        finalhtmllist.push(ch);
    }
    if (!inTag && inMark){
            finalhtmllist.push(endtag);
            taginfo.push(endtag, ch_i);
            inMark = false;
    }
    console.log("NEW: ", finalhtmllist.join(''));
    console.log("ALL PUSHED",endtag, taginfo.taglocs)
    return [finalhtmllist.join(''), [taginfo.taglocs], taginfo.addedtagwidth]
}


function highlight(color, start, end){
    var body = document.body.innerHTML;
    var starttag    = markS(color);
    var endtag      = markE();
    var prefix      = body.substring(0, start);
    var mid         = body.substring(start, end);
    var suffix      = body.substring(end);
    var insideresults = highlightInside(mid, starttag, endtag, start);

    // highlight everythign until you hit an end tag, and then recall this same function for substring after that tag
    var newbody = prefix + insideresults[0] + suffix;
    alltaglocs = alltaglocs.concat(insideresults[1]);  // keep track of where you put tags
    console.log("***Changing end***");
    setprevContextEnd(prevContextEnd);
    console.log(insideresults[2]);
    setprevContextEnd(prevContextEnd+insideresults[2]);  // lengthen new context by the mark lengths
    return newbody;
}

function addContext(highlighted){
    var [start, end] = htmlsearchRecursive(highlighted, document.body.innerHTML);

    if (start == -1) {
         alltaglocs = alltaglocs.concat([[[-1,-1], [-1,-1]]]);
        console.log("Search failed, pushed empty to alltaglocs");
        notify(WARNINGCOLOR);
        console.log(alltaglocs);
        return;
    }
    var smark = markS(CONTEXTCOLOR);
    setprevContextStart(start);
    setprevContextEnd(end);
    var newbody = highlight(CONTEXTCOLOR, prevContextStart, prevContextEnd);
    document.body.innerHTML = newbody;
};

function addCol(highlighted, color){
    var body = document.body.innerHTML;
    console.log("finding " + highlighted + " on indexes " + prevContextStart.toString() + " : " + prevContextEnd.toString() + " in ["+
                body.substring(prevContextStart, prevContextEnd) + "] .")
    var offsets = htmlsearchRecursive(highlighted, body.substring(prevContextStart, prevContextEnd));
    if (offsets[0][0] == -1) {
         alltaglocs = alltaglocs.concat([[[-1,-1], [-1,-1]]]);
         notify(WARNINGCOLOR);
        console.log("Search failed, pushed empty to alltaglocs");
        console.log(alltaglocs);
        return;
    }
    console.log("offsets ", offsets);
    var start = prevContextStart + offsets[0];
    var end = prevContextStart + offsets[1];
    console.log("start end ", start, end);
    var newbody = highlight(color, start, end)
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
    if (!alltaglocs){
        return;
    }
    var alltagstoundo = alltaglocs.pop();
    if (alltagstoundo[0] == -1) {  // [[-1,-1], [-1,-1]]
        console.log("Last item wasn't found, no highlighting to undo.")
        return;
    }
    var body = document.body.innerHTML;
    console.log("ATTU", alltagstoundo);
    var htmlbuilt = [];
    htmlbuilt.push(body.substring(0, alltagstoundo[0][0]));
    console.log("PUSHED ", 0, alltagstoundo[0][0]);

    var prevend = alltagstoundo[0][1];
    var shrinkage = alltagstoundo[0][1] - alltagstoundo[0][0];
    for (var t=1; t < alltagstoundo.length; t++){
        htmlbuilt.push(body.substring(prevend, alltagstoundo[t][0]));
        shrinkage += (alltagstoundo[t][1] - alltagstoundo[t][0]);
        console.log("PUSHED ", prevend, alltagstoundo[t][0]);
        prevend = alltagstoundo[t][1];
    }
    htmlbuilt.push(body.substring(alltagstoundo[alltagstoundo.length - 1][1]))
    console.log("PUSHED ", alltagstoundo[alltagstoundo.length - 1][1]);

    document.body.innerHTML = htmlbuilt.join('');
    setprevContextEnd(prevContextEnd - shrinkage);
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
    return [-1, -1];
};

/*
function htmlsearch(lostboy, context){
    var ctxj;
    for (var ctxi = 0; ctxi < context.length - lostboy.length; ctxi++) {
        if (ctxi > (context.length - lostboy.length)){
            return -1;
        }
        if (context[ctxi] !== lostboy[0]){
            continue;
        }
        ctxj = ctxi;
        for (var lbi = 0; lbi < lostboy.length; lbi++, ctxj++) {
            if (!lostboy[lbi].trim()){
               ctxj--;
               continue;
            }
            var stuck = true;
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
*/

function test(what){
var b = document.body.innerHTML;

var t0 = performance.now();
var res = b.search(what);
console.log('searchn ',performance.now()-t0, " ms, ", res);

if (res != -1) { console.log(b.substring(res, res+what.length));}
/*
var t0 = performance.now();
var res = htmlsearch(what, b);
console.log('charles ',performance.now()-t0, " ms, ", res);
if (res[0] != -1) { console.log(b.substring(res[0], res[1]));}
*/
var t0 = performance.now();
var res = htmlsearchRecursive(what,b);
console.log('minerec ',performance.now()-t0, " ms, ", res);
if (res[0] != -1) { console.log(b.substring(res[0], res[1]));}
};
