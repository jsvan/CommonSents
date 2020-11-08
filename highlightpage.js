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
    console.log("prevCon set to ", prevContextStart);
}

function setprevContextEnd(num){
    prevContextEnd = num;
    console.log("prevCon set to ", prevContextEnd);
    console.log("Context now [" + document.body.innerHTML.substring(prevContextStart, prevContextEnd) + "]");
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
    return [builtstring, builtstring.length];
};

function markE(){
    var builtstring = " </mark> ";
    setprevContextEnd(prevContextEnd + builtstring.length)
    return [builtstring, builtstring.length];
};

function addContext(highlighted){
    var body = document.body.innerHTML;
    console.log("CONTEXT finding [" + highlighted + "]");
    try{
        var start = body.match(highlighted).index;
        var end = start + highlighted.length;
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
    var start = prevContextStart + body.substring(prevContextStart, prevContextEnd).match(highlighted).index;
    var end = start + highlighted.length;
    var smark = markS(color);
    var emark = markE();
    var newbody = body.substring(0, start) + smark[0] + body.substring(start, end) + emark[0] + body.substring(end);

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

function htmlsearch(lostboy, context){
    var ctxj = 0;
    for (var ctxi = 0; ctxi < context.length - lostboy.length; ctxi++) {

        if (ctxi > (context.length - lostboy.length)){
            return -1;
        }

        ctxj = ctxi;
        for (var lbi = 0; lbi < lostboy.length; lbi++) {
            if (!lostboy[lbi].trim()){
               continue;
            }
            var stuck = true;
            while (stuck){
                stuck = false;
                if (!context[ctxi].trim()){
                   ctxi++;
                   stuck = true;
                   continue;
                }
                console.log("&", context[ctxi + lbi])
                if (context[ctxi + lbi] == '<'){
                    console.log("*", context[ctxi + lbi])
                    stuck = true;
                    while(context[ctxi+lbi] != '>'){
                        console.log("**"+context[ctxi + lbi])
                        ctxi++;
                    }
                }
            }
            console.log(lostboy[lbi], context[ctxi + lbi])
            if (context[ctxi + lbi] != lostboy[lbi]) {
                break;
            }
        }
        if (lbi == lostboy.length){
            return [ctxj, ctxi+lbi];  // found at ctxi
        }
    }
    return -1;
};

  // htmlsearch("Grund zur Moderation.", " Grund zur<br>Moderation.  ");