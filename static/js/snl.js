/* jshint undef: false */
/* jshint unused: false */
/* jshint expr: true */
var Player = {1:"Player 1", 2:"Player 2", 3:"Player 3", 4:"Player 4"};
var PlayerPosition = {1:0, 2:0, 3:0, 4:0};
var ladders =
    [{start:5, finish:14}, {start:9, finish:31}, {start:20, finish:38},
    {start:28, finish:84}, {start:40, finish:59}, {start:51, finish:67},
    {start:63, finish:81}, {start:71, finish:91}];
var snakes =
    [{start:99, finish:78}, {start:95, finish:75}, {start:93, finish:73},
    {start:87, finish:24}, {start:64, finish:60}, {start:62, finish:19},
    {start:54, finish:34}, {start:17, finish:7}];
var noOfSnakes = 8;
var noOfLadders = 8;
var blockedPlaces = [0, 1, 100];
var totalPlayers = 4;
var currentPlayer = 1;
var currentDiceValue = 0;
var ongoingMove = false;
var diceRollQueue = [];
var extraLadderRoll = 0;

if (typeof jQuery === 'undefined') {
    throw new Error('Bootstrap\'s JavaScript requires jQuery');
}

+function ($) {
    'use strict';
    var version = $.fn.jquery.split(' ')[0].split('.');
    if ((version[0] < 2 && version[1] < 9) || (version[0] === 1 && version[1] === 9 && version[2] < 1)) {
    throw new Error('Bootstrap\'s JavaScript requires jQuery version 1.9.1 or higher');
    }
}(jQuery);

/*
// Home page related functions
*/
+function ($) {
    'use strict';
    //$(".wrapper").height() = $(".wrapper").width();
    var snlBoard = $("#id-snl-board");
    for (var i = 99; i >= 0; --i) {
        var marker = i+1;
        if (!(Math.floor(i/10)%2)){
            marker = 10*(Math.floor(i/10)+1) - i%10;
        }
        var id = "id-snl-cell-" + marker;
        var r = Math.floor(Math.random()*256);
        var g = Math.floor(Math.random()*256);
        var b = Math.floor(Math.random()*256);
        var a = Math.random()*0.2;
        a = 0;
        //var content = marker+":"+ r+":"+ g+":" + b+":" + Math.floor(a*10)/10;
        //var content = "<p class='snl-cell-no'>" + marker + "</p>";
        var playersLegends = '<p class="snl-cell-player player1"><i class="fa fa-lg fa-circle"> </i></p>';
        playersLegends += '<p class="snl-cell-player player2"><i class="fa fa-lg fa-circle"> </i></p>';
        playersLegends += '<p class="snl-cell-player player3"><i class="fa fa-lg fa-circle"> </i></p>';
        playersLegends += '<p class="snl-cell-player player4"><i class="fa fa-lg fa-circle"> </i></p>';

        //var content = "<p class='snl-cell-no'>&nbsp;</p>";
        //content = "";

        var cell = "<div id='" + id + "' class='snl-cell'>" + playersLegends + "</div>";
        snlBoard.append(cell);
        //$("#" + id).css("border-top-olor", "rgb("+r+","+g+","+b+")");
        $("#" + id).css("background-color", "rgba("+r+","+g+","+b+","+a+")");
    };

}(jQuery);

+function ($) {
    'use strict';
    $(".snl-cell").hover(
        function() {
            $( this ).css("opacity", 0.2);
        }, function() {
            $( this ).css("opacity", 1.0);
        }
    );
}(jQuery);

+function ($) {
    'use strict';
    $(".snl-cell").click(
        function() {
            $( this ).css("color", "white");
        }
    );
}(jQuery);

function addToSVG(element, elattr, id) {
   el = $(document.createElementNS('http://www.w3.org/2000/svg', element));
   el.attr(elattr).appendTo(id);
}

function addTextToSVG(element, elattr, id, txt) {
   el = $(document.createElementNS('http://www.w3.org/2000/svg', element));
   el.text(txt);
   el.attr(elattr).appendTo(id);
}

function resolveCoOrdinates(cell){
    'use strict';
    var val = cell - 1;
    var row = 10 - Math.floor(val / 10);
    var col = (val % 10) + 1;
    if(row%2 != 0){
        col = 11 - col;
    }
    var x = (col*20) - 10;
    var y = (row * 20) - 10;
    return {"X":x, "Y":y}
}

/*
//  Generate Random Points
*/
function createLadder(){
    const MAX_START = 81;
    var s = 0;
    while($.inArray(s, blockedPlaces) !== -1){
        s = Math.floor(Math.random()*MAX_START);
    }
    var f = 0;
    while($.inArray(f, blockedPlaces) !== -1){
        var startRow = Math.floor((s-1)/10);
        var minFinRow = startRow + 1;
        var minFin = (minFinRow*10) + 1;
        f = minFin + Math.floor(Math.random()*(100 - minFin));
    }
    blockedPlaces.push(s);
    blockedPlaces.push(f);
    return {"S":s, "F":f};
}

function createSnake(){
    const MIN_START = 11;
    var s = 0;
    while($.inArray(s, blockedPlaces) !== -1){
        s = MIN_START + Math.floor(Math.random()*(100 - MIN_START));
    }
    var co_ = 0;
    var f = 0;
    while($.inArray(f, blockedPlaces) !== -1){
        if (co_ > 200){
            console.log("Max collision reached: finish value set - ", f);
            break;
        }
        co_++;
        var startRow = Math.floor((s-1)/10);
        var maxFinRow = startRow;
        var maxFin = maxFinRow * 10;
        f = Math.floor(Math.random()*maxFin);
    }
    blockedPlaces.push(s);
    blockedPlaces.push(f);
    return {"S":s, "F":f};
}

+function ($) {
    'use strict';
    ladders = [];
    snakes = [];
    blockedPlaces = [0, 1, 100];
    var noOfLadders = 8;
    var noOfSnakes = 8;
    for (var i = 0; i < noOfLadders; ++i){
        var L = createLadder();
        ladders.push({start:L.S, finish:L.F});
    }
    for (var i = 0; i < noOfSnakes; ++i){
        var S = createSnake();
        snakes.push({start:S.S, finish:S.F});
    }

}(jQuery);

/*
//  Draw elements
*/
+function ($) {
    'use strict';
    var svgChq = "#id-snl-checkers-svg";
    for (var i = 99; i >= 0; --i) {
        var marker = i+1;
        if (!(Math.floor(i/10)%2)){
            marker = 10*(Math.floor(i/10)+1) - i%10;
        }
        //var id = "id-snl-cell-" + marker;
        var s = resolveCoOrdinates(marker);
        var color = ["green", "white"];
        addToSVG('rect', {x:(s.X - 10), y:(s.Y - 10), rx:0, ry:0, width:20, height:20, fill:"green", stroke:"#ffffff", "stroke-width":0.25, "stroke-opacity": 0.5}, svgChq);
        addToSVG('circle', {cx:(s.X - 5), cy:(s.Y + 5), r:4, fill:"white", "stroke":"white", opacity:0.1}, svgChq);
        addTextToSVG('text', {x:(s.X - 5), y:(s.Y + 5), fill:"white", "font-family":"Helvetica Neue, sans-serif", "font-size":4, "text-anchor":"middle", "alignment-baseline":"middle"}, svgChq, marker);
    }
}(jQuery);

+function ($) {
    'use strict';
    var svgLad = "#id-snl-ladders-svg";
    for (var lad in ladders){
        var s = resolveCoOrdinates(ladders[lad].start);
        var f = resolveCoOrdinates(ladders[lad].finish);
        if(s.X == f.X){
            f.X = f.X - 2;
            s.X = s.X + 2;
        }
        addToSVG('line', {x1:s.X, y1:s.Y, x2:f.X, y2:f.Y, stroke:'#f1c40f', "stroke-width":8, "stroke-opacity": 0.5}, svgLad);
        addToSVG('line', {x1:s.X, y1:s.Y, x2:f.X, y2:f.Y, stroke:'#34495e', "stroke-width":8, "stroke-opacity": 1, "stroke-dasharray":"1, 3"}, svgLad);
    }
}(jQuery);

+function ($) {
    'use strict';
    var svgSn = "#id-snl-snakes-svg";
    for (var sn in snakes){
        var s = resolveCoOrdinates(snakes[sn].start);
        var f = resolveCoOrdinates(snakes[sn].finish);
        var theta = Math.atan((s.Y - f.Y)/(s.X - f.X));
        const d = 6;
        var Ax = (s.X + d*Math.sin(theta)).toFixed(1);
        var Ay = (s.Y - d*Math.cos(theta)).toFixed(1);
        var Bx = (s.X - d*Math.sin(theta)).toFixed(1);
        var By = (s.Y + d*Math.cos(theta)).toFixed(1);
        //console.log(snakes[sn].start + ": <"+s.X+", "+ s.Y+"> <"+f.X+", "+f.Y+"> "+theta*(180/Math.PI));
        //console.log(Ax, Ay, Bx, By);
        var pathdata = 'M'+f.X+','+f.Y+' L'+Ax+','+Ay+' '+Bx+','+By+' Z L'+s.X+','+s.Y;
        /*if (Math.abs(theta*(180/Math.PI)) == 45){
            console.log("%c"+pathdata, 'background: #222; color: #bada55; padding: 2px 8px; border-radius: 4px;');
        }*/
        addToSVG('path', {d: pathdata, fill:'transparent', stroke:'gold', "stroke-width":0.25}, svgSn);

        var sweep = (theta<0)?1:0;
        pathdata = 'M'+Ax+','+Ay+' A'+d+','+d+' 0 0,'+sweep+' '+Bx+','+By+' Z';
        addToSVG('path', {d: pathdata, fill:'#ff0000', stroke:'gold', "stroke-width":0.25}, svgSn);
        //addToSVG('circle', {cx: s.X, cy:s.Y, r:3, stroke:'#ff0000', "stroke-width":0, fill:'#ff3300'}, svgSn);
        addToSVG('circle', {cx: f.X, cy:f.Y, r:1.5, stroke:'gold', "stroke-width":0.25, fill:'#ff0000'}, svgSn);
    }
}(jQuery);

/*
// Animation for rolling dice
*/
+function ($) {
    'use strict';
    $('#id-snl-dice-big').delay(1000).fadeOut();
    $("#id-snl-dice").bind('click', function() {
        currentDiceValue = Math.floor(Math.random() * 6) + 1;
        var src = "./static/img/assets/diceface-" + currentDiceValue + ".svg";
        $('#id-snl-dice-big').attr("src", src);
        $('#id-snl-dice-big').fadeIn( "slow" );
        $('#id-snl-dice-big').delay(1000).fadeOut( "slow" );
        $('#id-snl-diceface > img').fadeOut( "fast",function() {
            $('#id-snl-diceface > img').attr("src", src);
        });
        $('#id-snl-diceface > img').delay(500).fadeIn( "slow" );
    });
}(jQuery);
/*
// Player moves after rolling dice
*/
function animateMove(startLocation){
    "snl-cell-player player4 present";
    var idStart = "id-snl-cell-" + startLocation;
    var idEnd = "id-snl-cell-" + PlayerPosition[currentPlayer];
    //$("#"+id+"> .player"+currentPlayer).delay(1000).removeClass("present");
    if(startLocation == 0){
        console.log("%c"+Player[currentPlayer], 'background: #222; color: #bada55; padding: 2px 8px; border-radius: 4px;');
        //0$("#"+idEnd+"> .player"+currentPlayer).fadeIn("slow");
    }else{
        //0$("#"+idStart+"> .player"+currentPlayer).delay(1000).fadeOut("slow",function(){
            //0$("#"+idEnd+"> .player"+currentPlayer).fadeIn("slow");
        //0});
    }
    //id = "id-snl-cell-" + PlayerPosition[currentPlayer];
    //$("#"+id+"> .player"+currentPlayer).delay(500).addClass("present");

    var st = "%c"+Player[currentPlayer]+" moves from "+startLocation+" to "+PlayerPosition[currentPlayer]
    console.log(st, 'background: #222; color: #bada55; padding: 2px 8px; border-radius: 4px;');
}

function makeMoves(){
    for (var v in diceRollQueue){
        var locationBeforeRoll = (PlayerPosition[currentPlayer]);
        PlayerPosition[currentPlayer] = PlayerPosition[currentPlayer] + diceRollQueue[v];
        if (PlayerPosition[currentPlayer] == 100){
            console.log((PlayerPosition[currentPlayer]), "wins!");
        }else if (PlayerPosition[currentPlayer] > 100){
            PlayerPosition[currentPlayer] = 200 - PlayerPosition[currentPlayer];
        }
        animateMove(locationBeforeRoll);
        for (var lad in ladders){
            if (ladders[lad].start == PlayerPosition[currentPlayer]){
                PlayerPosition[currentPlayer] = ladders[lad].finish;
                console.log("Ladder");
                animateMove(ladders[lad].start);
                ++extraLadderRoll;
                break;
            }
        }
        for (var sn in snakes){
            if (snakes[sn].start == PlayerPosition[currentPlayer]){
                PlayerPosition[currentPlayer] = snakes[sn].finish;
                console.log("Snake");
                animateMove(snakes[sn].start);
                break;
            }
        }
        //console.log(locationBeforeRoll, "-->", PlayerPosition[currentPlayer], $("#"+id));
    }
}

function postDiceRoll(){
    diceRollQueue.push(currentDiceValue);
    if (currentDiceValue == 6) {
        ongoingMove = true;
        if (diceRollQueue.length == 3){
            diceRollQueue = [];
        }
    }else{
        console.log(Player[currentPlayer], "at",PlayerPosition[currentPlayer], "rolled", diceRollQueue);
        makeMoves();
        diceRollQueue = [];
        ongoingMove = false;
        if (extraLadderRoll <= 0){
            currentPlayer = (currentPlayer % totalPlayers) + 1;
        }else{
            --extraLadderRoll;
        }
    }
}

+function ($) {
    'use strict';
    $("#id-snl-dice").bind('click', function() {
        console.clear();
        postDiceRoll();
        if (!ongoingMove){
            for (var i = 1; i <= totalPlayers; ++i){
                $("#id-snl-player-" + i).removeClass( "active");
                if (i == currentPlayer){
                    $("#id-snl-player-" + currentPlayer).addClass( "active");
                }
            }
        }
        console.log("A:", PlayerPosition[1], "B:", PlayerPosition[2], "C:", PlayerPosition[3], "D:", PlayerPosition[4]);
    });
}(jQuery);
/*
$.getJSON('/load', {m: fa}, function(data) {
    $('input[name="index"]').val(data["result"]["mods"].length);
    showmodules(data["result"], packages);
});
return false;

/*
$(function() {
    $('span#tab0').bind('click', function() {
        packages = true;
        $('span#tab1').removeClass("active_tab" );
        if(!$('span#tab0').hasClass("active_tab" )){
            $('span#tab0').addClass("active_tab" );
        }
        $('input[name="searching_pkg"]').val("True");
        $("a.homelink").attr("href", "/?searching_pkg=True");

        $.getJSON('/load', {
            index: 0,
            searching_pkg: $('input[name="searching_pkg"]').val(),
            searchkey: '{{key}}',
            window_w: Math.floor($( window ).width()/276),
            window_h: Math.ceil(($( window ).height()-160)/276)
        }, function(data) {
            $('input[name="index"]').val(data["result"]["mods"].length);
            showmodules(data["result"], packages);
        });
        return false;
    });
});
*/
