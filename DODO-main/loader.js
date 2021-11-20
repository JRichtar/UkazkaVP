var fact_index = 0;
var facts = [
    'Gymnázium je vybaveno knihovnou, která obsahuje přes 16 000 knih.',
    'Motto: Per aspera ad astra.',
    'Škola má bezbariérový přístup.',
    'Škola má kapacitu 590 žáků, v současné době má 20 tříd. '
]

var fouryear;
var yearSelected;
var loader_on = false;
var loadStep = 0;
var loadSteps = Infinity;
var int;

var start_time = 1610406000
//var start_time = 106219200

function include(filename, onload, id) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    if(id) {
    	script.id = id;
    }
    script.src = filename;
    script.type = 'text/javascript';
    script.onload = script.onreadystatechange = function() {
        if (script.readyState) {
            if (script.readyState === 'complete' || script.readyState === 'loaded') {
                script.onreadystatechange = null;onload();}
            } else {
                onload();
            }
        };
    head.appendChild(script);
}

window.resourceCache = {};
var loading = [];
function resourcesLoad(Arr) {
    Arr.forEach(function(url) {
        if(window.resourceCache[url]) {
            return window.resourceCache[url];
        }
        else {
            var img = new Image();
            img.onload = function() {
                window.resourceCache[url] = img;
                partialCallback()

                if(loadStep == loadSteps) {
                    resourceReadyCallback()
                }
            };
            window.resourceCache[url] = false;
            img.src = url;
        }
    });
}


window.onload = function() {
    if (Date.now()/1000 > start_time) {
        load_app()
    } else {
        document.getElementById("timeout").style.display = "block"
        time_dif = start_time - Date.now()/1000;
        counter = time_display(time_dif)
        document.getElementById("timeout-counter").innerHTML = counter

        timeout_interval = setInterval(() => {
            time_dif = start_time - Date.now()/1000;
            if (time_dif > 0) {
                counter = time_display(time_dif)
                document.getElementById("timeout-counter").innerHTML = counter
            } else {
                clearInterval(timeout_interval)
                load_app();
            }
        }, 1000)
    }

   
}

function yearSelect(isFouryear) {
    fouryear = isFouryear;
    yearSelected = true;

    document.getElementById("intro").style.display = "none";
    document.getElementById("introvideo").style.display = "block";

    document.getElementById("introcontinue").addEventListener("click", (event) => {
        loading_screen();
        if (loadStep == loadSteps) {
            start_app();
        }
    });
}

function loading_screen() {
    loader_on = true;

    document.getElementById("introvideo").style.display = "none";
    var f = document.getElementById("introframe");
    f.parentNode.removeChild(f);
    document.getElementById("loader").style.display = "block";

    document.getElementById("fact").innerHTML = "<em>" + facts[fact_index] + "</em>";
    int = setInterval(function() {
        fact_index = (fact_index + 1) % facts.length;

        var fact = document.getElementById("fact");
        if (!fact) {
            clearInterval(int);
            return;
        }

        fact.innerHTML = facts[fact_index];
    }, 3000);
}


function resourceReadyCallback() {
    if (loader_on)
        start_app();
}

function partialCallback() {
    loadStep += 1
    document.getElementById("loader-bar").style.width = (loadStep/loadSteps*100)+"%";
}

function start_app() {
    var overlay = document.getElementById("overlay");
    if (overlay) { overlay.style.filter = "blur(2px)" };
    window.start(fouryear);
    document.body.style.backgroundImage = "none";
}

function load_app() {
    document.getElementById("timeout").style.display = "none"
    document.getElementById("intro").style.display = "block"
    include('bundle.js', function() {
        loadStep += 1
        document.getElementById("loader-bar").style.width = (loadStep/loadSteps*100)+"%";
        res = [ //Add all assets that should be preloaded for smooth play, they will be loaded to browser cache.
            'assets/pano/01.jpg',
            'assets/pano/02.jpg',
            'assets/pano/03.jpg',
            'assets/pano/04.jpg',
            'assets/pano/05.jpg',
            'assets/pano/06.jpg',
            'assets/pano/07.jpg',
            'assets/map/0.png',
            'assets/map/1.png',
            'assets/map/2.png',
            'assets/map/3.png',
            'assets/map/player.png'
        ];
        loadSteps = res.length+1;
        resourcesLoad(res);
    })
    var button4 = document.getElementById("fouryear");
    var button8 = document.getElementById("eightyear");

    if (button4 && button8) {
        button4.addEventListener("click", (event) => { yearSelect(true); });
        button8.addEventListener("click", (event) => { yearSelect(false); });
    }
    if (localStorage.save !== undefined && confirm("Chcete načíst uložený stav hry?")) {
        document.getElementById("intro").style.display = "none";
        loading_screen();
    }
}

function time_display(time_dif) {
    counter = ""
    days = Math.floor(time_dif/3600/24)
    hours = Math.floor(time_dif/3600%24)
    minutes = Math.floor(time_dif/60%60)
    seconds = Math.floor(time_dif%60)
    if (days > 0) {
        if(days == 1) {
            counter += String(days)+" den"
        } else if(days < 5) {
            counter += String(days)+" dny"
        } else {
            counter += String(days)+" dnů"
        }
        counter += ", "
    }
    if (hours > 0) {
        if(hours == 1) {
            counter += String(hours)+" hodinu"
        } else if(hours < 5) {
            counter += String(hours)+" hodiny"
        } else {
            counter += String(hours)+" hodin"
        }
        counter += ", "
    }

    if (minutes > 0) {
        if(minutes == 1) {
            counter += String(minutes)+" minutu"
        } else if(minutes < 5) {
            counter += String(minutes)+" minuty"
        } else {
            counter += String(minutes)+" minut"
        }
        counter += " a "
    }

    if(seconds == 1) {
        counter += String(seconds)+" vteřinu"
    } else if(seconds < 5) {
        counter += String(seconds)+" vteřiny"
    } else {
        counter += String(seconds)+" vteřin"
    }
    return counter
}