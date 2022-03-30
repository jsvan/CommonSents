window.onload = document.getElementById("printpage").innerHTML = stringifyLS();

document.getElementById("clearLS").addEventListener("click", deleteSelections); 


function stringifyLS() {
    let itemlist = [];
    chrome.storage.sync.get(null, function(resultdict) {
        let keys =  Object.keys(resultdict);
        itemlist.push( "GOV_DIST" + ': '+ getLS("WEALTH"));
        itemlist.push( "CULTURE" + ': '+ getLS("NATIONALISM"));
        itemlist.push( "COUNTRY" + ': '+ getLS("COUNTRY"));
        itemlist.push( "POL_LEAN" + ': '+ getLS("GROUP_IDENTITY"));

        for (var i = 0; i < getCount(); i++) {
            key = i.toString();
            itemlist.push( getLS(key) );
        }
        tosend = itemlist.join('<br>');
        console.log(tosend);
        return tosend;

    });

};


function deleteSelections() {
    for (var i = 0; i < getCount(); i++)
    {
        rmLS(i);
    }
    setLS("sentiCount", "0");
    document.getElementById("cleared_message").innerHTML = "Your items have been cleared.";
    document.getElementById("printpage").innerHTML = stringifyLS();
};

function setLS(key, val) {
    var k = "senti_" + key;
     chrome.storage.sync.set({k: val});
}

function getLS(key) {
    var k = "senti_" + key;
    chrome.storage.sync.get(k, function(resultdict) {
        return resultdict[k];
    });
}

function rmLS(key) {
    var k = "senti_";
     chrome.storage.sync.remove(k);
}

function getCount() {
    return parseInt(getLS("sentiCount"));
}
