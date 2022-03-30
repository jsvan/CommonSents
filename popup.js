document.getElementById("submit").addEventListener("click", submitSurvey);
document.getElementById("storage").addEventListener("click", openPrintPage);
document.getElementById("instructions").addEventListener("click", openInstructionsPage);
document.getElementById("privacypolicy").addEventListener("click", openPrivacyPage);
document.getElementById("editsurvey").addEventListener("click", expandSurvey);
document.getElementById("highlight").addEventListener("click", toggleHighlight);
document.getElementById("goodevil").addEventListener("click", toggleGoodEvil);
document.getElementById("strongweak").addEventListener("click", toggleGoodEvil);
// document.getElementById("goodevil").checked = true;
window.onload = load_page();


function load_page() {
    if (getHighlight()) {
        document.getElementById("highlight").innerHTML = "On";
        document.getElementById("highlighttext").innerHTML = "<mark>text highlighting</mark>";
    }
    else {
        document.getElementById("highlight").innerHTML = "Off";
        document.getElementById("highlighttext").innerHTML = "text highlighting";
    }

    if (getGoodEvil()) {
        document.getElementById("goodevil").checked = true;
    }
    else {
        document.getElementById("strongweak").checked = true;
    }

    var wealth = getLS("WEALTH");
    var nationalism = getLS("NATIONALISM");
    var country = getLS("COUNTRY");
    var identity = getLS("GROUP_IDENTITY");

    if (wealth) {
        document.getElementsByName("wealth")[wealth - 1].checked = "checked";
    }

    if (nationalism) {
        document.getElementsByName("nationalism")[nationalism - 1].checked = "checked";
    }

    if (country) {
        document.getElementById("country").value = country;
    }

    if (identity) {
        document.getElementsByName("group_identity")[identity - 1].checked = "checked";
    }

    if (wealth && nationalism && country && identity) {
        document.getElementById("survey").style.display = "none";
        document.getElementById("collapsed").style.display = "block";
    }
}

// Stores a user's answers to the popup questions in LS
function submitSurvey() {
    var wealthrad = document.getElementsByName("wealth");
    for (var i = 0, length = wealthrad.length; i < length; i++) {
        if (wealthrad[i].checked) {
            wealth = wealthrad[i].value.toString();
            setLS("WEALTH", wealth); 
            break;
        }
    }

    var natrad = document.getElementsByName("nationalism");
    for (var i = 0, length = natrad.length; i < length; i++) {
        if (natrad[i].checked) {
            nationalism = natrad[i].value.toString();
            setLS("NATIONALISM", nationalism); 
            break;
        }
    }

    var country = document.getElementById("country").value;
    setLS("COUNTRY", country); 

    //var group_identity = document.getElementById("group_identity").value;
    //setLS("GROUP_IDENTITY", group_identity);

    var idnrad = document.getElementsByName("group_identity");
    for (var i = 0, length = idnrad.length; i < length; i++) {
        if (idnrad[i].checked) {
            group_identity = idnrad[i].value.toString();
            setLS("GROUP_IDENTITY", group_identity);
            break;
        }
    }

    document.getElementById("survey").style.display = "none";
    document.getElementById("collapsed").style.display = "block";
}

// switches text highlighting on or off
function toggleHighlight() {
    if (getHighlight()) {  // OFF state
        document.getElementById("highlight").innerHTML = "Off";
        document.getElementById("highlighttext").innerHTML = "text highlighting";
        setLS("highlight", "0");
    } else {  // ON state
        document.getElementById("highlight").innerHTML = "On";
        document.getElementById("highlighttext").innerHTML = "<mark>text highlighting</mark>";
        setLS("highlight", "1");
    }
}

function toggleGoodEvil() {
    // goodevil getting clicked
    if (getGoodEvil()) {  // goodevil was ON, now will be OFF state
        document.getElementById("strongweak").checked = true;
        document.getElementById("goodevil").checked = false;
        setLS("goodevil", "0");
    } else {  // goodevil was OFF and now will be ON state
        document.getElementById("strongweak").checked = false;
        document.getElementById("goodevil").checked = true;
        setLS("goodevil", "1");
    }
}



function expandSurvey() {
    document.getElementById("survey").style.display = "block";
    document.getElementById("collapsed").style.display = "none";
}

function openPrivacyPage() {
    chrome.tabs.create({'url':"https://jsvan.github.io/Common_Sents_Privacy_Policy.html", 'active':true});
};

function openPrintPage() {
    chrome.tabs.create({'url':chrome.runtime.getURL("printpage.html"), 'active':true});
};

function openInstructionsPage() {
    chrome.tabs.create({'url':"https://jsvan.github.io/Common_Sents_Usage_Instructions.html", 'active':true});
};

function setLS(key, val) {
    var k = "senti_" + key;
    chrome.storage.sync.set({k: val});
}

function getLS(key) {
    chrome.storage.sync.get(["senti_" + key], function(resultdict){
        return resultdict["senti_" + key];
    });
}

function rmLS(key) {
     chrome.storage.sync.set.remove("senti_" + key);
}

function getHighlight() {
    return parseInt(getLS("highlight"));
}

function getGoodEvil() {
    return parseInt(getLS("goodevil"));
}

function getCount() {
    return parseInt(getLS("sentiCount"));
}