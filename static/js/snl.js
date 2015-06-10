/* jshint undef: false */
/* jshint unused: false */
/* jshint expr: true */
/*jshint esnext: true */
const debug = true;

var Player = {1:"Player 1", 2:"Player 2", 3:"Player 3", 4:"Player 4"};
var PlayerCol = {1:"#e74c3c", 2:"#3498db", 3:"#2ecc71", 4:"f1c40f"};
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
var gameEnded = false;

var soundMute = true;

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
// SVG Check
*/
+function ($) {
    if(!document.createElement('svg').getAttributeNS){
        $("body").empty();
        $("body").html("<center><h1>Your browser does not support SVG!</h1></center>");
        return;
    }
}(jQuery);

/*
// Mute Switch
*/
+function ($) {
    $("#id-snl-mute i").css("color", "#e74c3c");
    $("#id-snl-mute i").css("transform", "scale(1.6)");

    $("#id-snl-mute").click(function(){
        soundMute = !soundMute;
        if (soundMute){
            $("#id-snl-mute i").removeClass("fa-volume-up");
            $("#id-snl-mute i").addClass("fa-volume-off");
            $("#id-snl-mute i").css("color", "#e74c3c");
        }
        else{
            $("#id-snl-mute i").removeClass("fa-volume-off");
            $("#id-snl-mute i").addClass("fa-volume-up");
            $("#id-snl-mute i").css("color", "#2ecc71");
        }
    });
}(jQuery);

/*
// Home page related functions
*/
+function ($) {
    'use strict';
    var snlBoard = $("#id-snl-board");
    for (var i = 99; i >= 0; --i) {
        var marker = i+1;
        if ((Math.floor(i/10)%2) === 0){
            marker = 10*(Math.floor(i/10)+1) - i%10;
        }
        var id = "id-snl-cell-" + marker;
        var playersLegends = '<p class="snl-cell-player player1" data-placement="left" data-toggle="tooltip" data-original-title="Player 1"><i class="fa fa-lg fa-circle"> </i></p>';
        playersLegends += '<p class="snl-cell-player player2" data-placement="left" data-toggle="tooltip" data-original-title="Player 2"><i class="fa fa-lg fa-circle"> </i></p>';
        playersLegends += '<p class="snl-cell-player player3" data-placement="left" data-toggle="tooltip" data-original-title="Player 3"><i class="fa fa-lg fa-circle"> </i></p>';
        playersLegends += '<p class="snl-cell-player player4" data-placement="left" data-toggle="tooltip" data-original-title="Player 4"><i class="fa fa-lg fa-circle"> </i></p>';
        var cell = "<div id='" + id + "' class='snl-cell left' title='' data-placement='left' data-toggle='tooltip' data-original-title='"+marker+"'>" + playersLegends + "</div>";
        snlBoard.append(cell);
    }
    for (var j = 0; j<=10; j += 2){
        $("#id-snl-cell-" + (10*j)).attr("data-placement", "right");
        $("#id-snl-cell-" + (10*j +1)).attr("data-placement", "right");
    }
    // $(".snl-cell").tooltip(); // DO NOT REMOVE
    //$(".snl-cell-player").attr("data-delay", "{ 'show': 1500, 'hide': 1100 }");
    //$(".snl-cell-player").tooltip();

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
    if(row%2 !== 0){
        col = 11 - col;
    }
    var x = (col*20) - 10;
    var y = (row * 20) - 10;
    return {"X":x, "Y":y};
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
    var co_ = 0; // Fail safe measure. If rand fails >200 times
    var f = 0;
    while($.inArray(f, blockedPlaces) !== -1){
        if (co_ > 200){
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

function newBoardLayout(){
    'use strict';
    ladders = [];
    snakes = [];
    blockedPlaces = [0, 1, 100];
    var noOfLadders = 8;
    var noOfSnakes = 8;
    $("#id-snl-ladders-svg").empty();
    $("#id-snl-snakes-svg").empty();

    for (var i = 0; i < noOfLadders; ++i){
        var L = createLadder();
        ladders.push({start:L.S, finish:L.F});
    }
    for (i = 0; i < noOfSnakes; ++i){
        var S = createSnake();
        snakes.push({start:S.S, finish:S.F});
    }
}

+function ($) {
    'use strict';
    newBoardLayout();
}(jQuery);

/*
//  Draw elements
*/
+function ($) {
    'use strict';
    var svgChq = "#id-snl-checkers-svg";
    for (var i = 99; i >= 0; --i) {
        var marker = i+1;
        if ((Math.floor(i/10)%2) === 0){
            marker = 10*(Math.floor(i/10)+1) - i%10;
        }
        var s = resolveCoOrdinates(marker);
        var color = ["green", "white"];
        addToSVG('rect', {x:(s.X - 10), y:(s.Y - 10), rx:0, ry:0, width:20, height:20, fill:"green", stroke:"#ffffff", "stroke-width":0.25, "stroke-opacity": 0.5}, svgChq);
        addToSVG('circle', {cx:(s.X - 5), cy:(s.Y + 5), r:4, fill:"white", "stroke":"white", opacity:0.1}, svgChq);
        addTextToSVG('text', {x:(s.X - 5), y:(s.Y + 5), fill:"white", "font-family":"Helvetica Neue, sans-serif", "font-size":4, "text-anchor":"middle", "alignment-baseline":"middle"}, svgChq, marker);
    }
    addTextToSVG('text', {x:10, y:188, fill:"white", "font-family":"Helvetica Neue, sans-serif", "font-size":4, "text-anchor":"middle", "alignment-baseline":"middle"}, svgChq, "Start");
    addTextToSVG('text', {x:10, y:8, fill:"white", "font-family":"Helvetica Neue, sans-serif", "font-size":4, "text-anchor":"middle", "alignment-baseline":"middle"}, svgChq, "Finish");
}(jQuery);

function drawLadders() {
    'use strict';
    var svgLad = "#id-snl-ladders-svg";
    for (var lad in ladders){
        var s = resolveCoOrdinates(ladders[lad].start);
        var f = resolveCoOrdinates(ladders[lad].finish);
        if(s.X === f.X){
            f.X = f.X - 2;
            s.X = s.X + 2;
        }
        var theta = Math.atan((s.Y - f.Y)/(s.X - f.X));
        const d = 4;
        // AC: Left rail, BD: Right rail
        var Ax = (s.X + d*Math.sin(theta)).toFixed(1);
        var Ay = (s.Y - d*Math.cos(theta)).toFixed(1);
        var Bx = (s.X - d*Math.sin(theta)).toFixed(1);
        var By = (s.Y + d*Math.cos(theta)).toFixed(1);
        var Cx = (f.X + d*Math.sin(theta)).toFixed(1);
        var Cy = (f.Y - d*Math.cos(theta)).toFixed(1);
        var Dx = (f.X - d*Math.sin(theta)).toFixed(1);
        var Dy = (f.Y + d*Math.cos(theta)).toFixed(1);

        addToSVG('line', {x1:f.X, y1:f.Y, x2:s.X, y2:s.Y, stroke:'white', "stroke-width":(2*d), "stroke-opacity": 1, "stroke-dasharray":"0.25, 3.75"}, svgLad);
        addToSVG('line', {x1:Ax, y1:Ay, x2:Cx, y2:Cy, stroke:'#dddddd', "stroke-width":0.5, "stroke-opacity": 1}, svgLad);
        addToSVG('line', {x1:Bx, y1:By, x2:Dx, y2:Dy, stroke:'#dddddd', "stroke-width":0.5, "stroke-opacity": 1}, svgLad);

        var angAdjust = theta<0? -1: 1;
        var txtAngle = (theta<0) ? theta*(180/Math.PI) + 90: theta*(180/Math.PI) - 90;
        var mx = (s.X + angAdjust*(d/2)*Math.cos(theta)).toFixed(1);
        var my = (s.Y + angAdjust*(d/2)*Math.sin(theta)).toFixed(1);
        addToSVG('circle', {cx: mx, cy: my, r:(d/2), fill:'white'}, svgLad);
        addTextToSVG('text', {x: mx, y: my, fill:"green", "font-family":"Helvetica Neue, sans-serif", "font-size":(d/2), "text-anchor":"middle", "alignment-baseline":"middle", transform:'rotate(' + txtAngle + ' ' + mx + ',' + my + ')' }, svgLad, ladders[lad].finish);
    }
}

function drawSnakes() {
    'use strict';
    var svgSn = "#id-snl-snakes-svg";
    for (var sn in snakes){
        var s = resolveCoOrdinates(snakes[sn].start);
        var f = resolveCoOrdinates(snakes[sn].finish);
        if(s.X === f.X){
            f.X = f.X - 2;
        }
        var theta = Math.atan((s.Y - f.Y)/(s.X - f.X));
        const d = 6;
        var Ax = (s.X + d*Math.sin(theta)).toFixed(1);
        var Ay = (s.Y - d*Math.cos(theta)).toFixed(1);
        var Bx = (s.X - d*Math.sin(theta)).toFixed(1);
        var By = (s.Y + d*Math.cos(theta)).toFixed(1);
        var pathdata = 'M'+f.X+','+f.Y+' L'+Ax+','+Ay+' '+Bx+','+By+' Z L'+s.X+','+s.Y;
        addToSVG('path', {d: pathdata, fill:'transparent', stroke:'gold', "stroke-width":0.25}, svgSn);

        var sweep = (theta<0)?1:0;
        pathdata = 'M'+Ax+','+Ay+' A'+d+','+d+' 0 0,'+sweep+' '+Bx+','+By+' Z';
        addToSVG('path', {d: pathdata, fill:'#e74c3c', stroke:'gold', "stroke-width":0.25}, svgSn);

        var angAdjust = theta<0? 1: -1;
        var txtAngle = (theta<0) ? theta*(180/Math.PI) + 90: theta*(180/Math.PI) - 90;
        var mx = (s.X + angAdjust*(d/3)*Math.cos(theta)).toFixed(1);
        var my = (s.Y + angAdjust*(d/3)*Math.sin(theta)).toFixed(1);
        addToSVG('circle', {cx: mx, cy: my, r:(d/3), fill:'white'}, svgSn);
        addTextToSVG('text', {x:mx, y:my, fill:"#e74c3c", "font-family":"Helvetica Neue, sans-serif", "font-size":(d/3), "text-anchor":"middle", "alignment-baseline":"middle", transform:'rotate(' + txtAngle + ' ' + mx + ',' + my + ')'}, svgSn, snakes[sn].finish);

        addToSVG('circle', {cx: f.X, cy:f.Y, r:1.5, stroke:'gold', "stroke-width":0.25, fill:'#e74c3c'}, svgSn);
    }
}

+function ($) {
    'use strict';
    drawLadders();
    drawSnakes();
}(jQuery);

function playSound (effect) {
    if(!soundMute){
        var audio = document.createElement('audio');
        audio.setAttribute('src', './static/sound/' + effect);
        audio.setAttribute('autoplay', 'autoplay');
        audio.addEventListener("load", function() {
            audio.play();
        }, true);
    }
}

/*
// Animation for rolling dice
*/
+function ($) {
    'use strict';
    $('#id-snl-dice-big').delay(1000).fadeOut();
    $("#id-snl-dice").bind('click', function() {
        if(!gameEnded){
            // Dice roll
            currentDiceValue = Math.floor(Math.random() * 6) + 1;
            // Dice roll sound
            if (currentDiceValue === 6){
                playSound ("dicerollsix.mp3");
            }else{
                playSound ("diceroll.mp3");
            }

            var src = "./static/images/cnlassets/diceface-" + currentDiceValue + ".svg";
            $('#id-snl-dice-big').attr("src", src);
            $('#id-snl-dice-big').fadeIn( "slow" );
            $('#id-snl-dice-big').delay(500).fadeOut( "slow" );
            $('#id-snl-diceface > img').fadeOut( "fast",function() {
                $('#id-snl-diceface > img').attr("src", src);
            });
            $('#id-snl-diceface > img').delay(500).fadeIn( "fast" );
            if(debug){
                currentDiceValue = 50;
            }
        }
    });
}(jQuery);


/*
// Player moves after rolling dice
*/
function highlightNextCell(){
    for (var pl=1; pl<=100; ++pl){
        $("#id-snl-cell-" + pl).css("background-image", "none");
    }
    setTimeout(function(){
        $("#id-snl-cell-" + PlayerPosition[currentPlayer]).css("background", "url(static/images/cnlassets/activecell.svg) no-repeat center center");
        $("#id-snl-cell-" + PlayerPosition[currentPlayer]).css("background-size","100%");
    }, 2000);
}

function animateMove(startLocation){
    var idStart = "id-snl-cell-" + startLocation;
    var idEnd = "id-snl-cell-" + PlayerPosition[currentPlayer];
    if(startLocation === 0){
        $("#"+idEnd+"> .player"+currentPlayer).delay(1500).fadeIn("slow");
    }else{
        $("#"+idStart+"> .player"+currentPlayer).delay(500).fadeOut("slow");
        $("#"+idEnd+"> .player"+currentPlayer).delay(1500).fadeIn("slow");
    }
    // Change tooltip for player
    $("#"+idEnd+"> .player"+currentPlayer).attr("data-original-title", Player[currentPlayer] +": "+ PlayerPosition[currentPlayer]);
}


function makeMoves(){
    for (var v in diceRollQueue){
        var locationBeforeRoll = (PlayerPosition[currentPlayer]);
        PlayerPosition[currentPlayer] = PlayerPosition[currentPlayer] + diceRollQueue[v];
        if (PlayerPosition[currentPlayer] > 100){
            PlayerPosition[currentPlayer] = 200 - PlayerPosition[currentPlayer];
        }
        else if (PlayerPosition[currentPlayer] === 100){
            gameEnded = true;
            extraLadderRoll = 0;
        }
        animateMove(locationBeforeRoll);

        for (var lad in ladders){
            if (ladders[lad].start === PlayerPosition[currentPlayer]){
                PlayerPosition[currentPlayer] = ladders[lad].finish;
                setTimeout(playSound ("ladder.mp3"), 1500);
                animateMove(ladders[lad].start);
                ++extraLadderRoll;
                break;
            }
        }
        for (var sn in snakes){
            if (snakes[sn].start === PlayerPosition[currentPlayer]){
                PlayerPosition[currentPlayer] = snakes[sn].finish;
                setTimeout(playSound ("snake.mp3"), 1500);
                animateMove(snakes[sn].start);
                break;
            }
        }
        $("#id-snl-player-"+currentPlayer+" a span i").text(" "+PlayerPosition[currentPlayer]);
        if(gameEnded){
            break;
        }
    }
}

function postDiceRoll(){
    if(PlayerPosition[currentPlayer] === 0){
        $("#id-snl-player-" + currentPlayer + " a i").addClass( "player" + currentPlayer).removeClass("fa-user").addClass("fa-user-times");
    }
    diceRollQueue.push(currentDiceValue);
    if (currentDiceValue === 6) {
        ongoingMove = true;
        var queued = diceRollQueue.length;
        if ( queued >= 3){
            var tmp = diceRollQueue[queued-1] + diceRollQueue[queued-2] + diceRollQueue[queued-3];
            if (tmp === 18){
                diceRollQueue = [];
            }
        }
    }
    else{
        makeMoves();
        diceRollQueue = [];
        ongoingMove = false;
        if ((extraLadderRoll <= 0) && (!gameEnded)){
            currentPlayer = (currentPlayer % totalPlayers) + 1;
        }else{
            --extraLadderRoll;
        }
    }
}

/*
// Reset Gameplay
*/
function resetGameplay(t){
    gameEnded = false;
    currentPlayer = 1;
    currentDiceValue = 0;
    ongoingMove = false;
    diceRollQueue = [];
    extraLadderRoll = 0;

    setTimeout(function(){
        for (var p in PlayerPosition){
            var cell = "id-snl-cell-" + PlayerPosition[p];
            // console.log(p, $("#"+cell+"> .player"+p));
            $("#"+cell+"> .player"+p).delay(t*500).fadeOut("slow");
            $("#"+cell).css("background-image", "none");
            PlayerPosition[p] = 0;
        }
        $("#id-snl-win-modalLabel > i").removeClass("fa-trophy").addClass("fa-users");
        for (var i = 1; i <= totalPlayers; ++i){
            $("#id-snl-player-" + i).removeClass( "active");
            $("#id-snl-player-" + i +" a span i").text("");
            $("#id-snl-player-" + i + " a i").removeClass( "player" + i).removeClass("fa-user-times").addClass("fa-user");

            $("#id-snl-result-p" + i + " i").css("color", "black");
            $("#id-snl-result-p" + i + " i").css("text-shadow", "none");
            $("#id-snl-result-p" + i + " i").removeClass("fa-trophy");
        }
        $("#id-snl-player-1").addClass( "active");
    }, t*2500);
}

function showWinModal(){
    playSound("win.mp3");
    $("#id-snl-win-modalLabel > i").text(" Winner: "+Player[currentPlayer]);
    $("#id-snl-win-modalLabel > i").removeClass("fa-users").addClass("fa-trophy");
    for (var i = 1; i <= totalPlayers; ++i){
        $("#id-snl-result-p" + i + " i").text(" "+Player[i]+": "+PlayerPosition[i]);
    }
    $("#id-snl-result-p" + currentPlayer + " i").css("color", "gold");
    $("#id-snl-result-p" + currentPlayer + " i").css("text-shadow", "0 0 1px orange");
    $("#id-snl-result-p" + currentPlayer + " i").addClass("fa-trophy");
    $('#id-snl-win-modal').modal('show', { keyboard: false });
}

/*
// Modal buttons
*/
+function ($) {
    $(document).on("click", "#id-snl-modal-btn-game", function(event){
        resetGameplay(0);
    });
}(jQuery);

+function ($) {
    $(document).on("click", "#id-snl-modal-btn-board", function(event){
        resetGameplay(0);
        newBoardLayout();
        drawLadders();
        drawSnakes();
    });
}(jQuery);

+function ($) {
    $(document).on("change", "#id-snl-report-kind", function(event){
        $("#id-snl-modal-btn-report").text($("#id-snl-report-kind").val());
    });
}(jQuery);


+function ($) {
    $(document).on("click", "#id-snl-modal-btn-report", function(event){
        event.preventDefault();
        var e = $("#id-snl-report-email").val();
        var t = $("#id-snl-report-title").val();
        var d = $("#id-snl-report-details").val();
        var k = $("#id-snl-report-kind option:selected").text().trim();
        $("#id-snl-report-form").get(0).reset();
        $("#id-snl-modal-btn-report").text( "Request Enhancement" );
        $.post('/report',
            {
                email: e,
                title: t,
                details: d,
                kind: k,
                reportingEnabled: false
            },
            function(data) {
                // console.log(data.result);
                $.notify.defaults( {
                    showAnimation: 'fadeIn',
                    hideAnimation: 'slideUp',
                    autoHideDelay: 1500
                });
                setTimeout(function(){
                    $.notify("Thank you. We're working on it!", "success");
                }, 1000);
            }
        );
    });
}(jQuery);

+function ($) {
    $("#id-snl-player-1").click(function() {
        var pCell = PlayerPosition[1];
        var notiLoc = (pCell > 90)? 'bottom right':'top right';
        $.notify.defaults( {
            globalPosition: 'top right',
            elementPosition: notiLoc,
            showAnimation: 'fadeIn',
            hideAnimation: 'fadeOut',
            showDuration: 100,
            autoHideDelay: 1500
        });
        $("#id-snl-cell-" + PlayerPosition[1]).notify(Player[1] + " is at " + PlayerPosition[1], "error");
    });
}(jQuery);
+function ($) {
    $("#id-snl-player-2").click(function() {
        var pCell = PlayerPosition[2];
        var notiLoc = (pCell > 90)? 'bottom right':'top right';
        $.notify.defaults( {
            globalPosition: 'top right',
            elementPosition: notiLoc,
            showAnimation: 'fadeIn',
            hideAnimation: 'fadeOut',
            showDuration: 100,
            autoHideDelay: 1500
        });
        $("#id-snl-cell-" + PlayerPosition[2]).notify(Player[2]+" is at "+ PlayerPosition[2], "info");
    });
}(jQuery);
+function ($) {
    $("#id-snl-player-3").click(function() {
        var pCell = PlayerPosition[3];
        var notiLoc = (pCell > 90)? 'bottom right':'top right';
        $.notify.defaults( {
            globalPosition: 'top right',
            elementPosition: notiLoc,
            showAnimation: 'fadeIn',
            hideAnimation: 'fadeOut',
            showDuration: 100,
            autoHideDelay: 1500
        });
        $("#id-snl-cell-" + PlayerPosition[3]).notify(Player[3]+" is at "+ PlayerPosition[3], "success");
    });
}(jQuery);

+function ($) {
    $("#id-snl-player-4").click(function() {
        var pCell = PlayerPosition[4];
        var notiLoc = (pCell > 90)? 'bottom right':'top right';
        $.notify.defaults( {
            globalPosition: 'top right',
            elementPosition: notiLoc,
            showAnimation: 'fadeIn',
            hideAnimation: 'fadeOut',
            showDuration: 100,
            autoHideDelay: 1500
        });
        $("#id-snl-cell-" + PlayerPosition[4]).notify(Player[4]+" is at "+ PlayerPosition[4], "warn");
    });
}(jQuery);

+function ($) {
    $("#id-snl-new-game").bind('click', function() {
        resetGameplay(0);
    });

    $("#id-snl-change-board").bind('click', function() {
        newBoardLayout();
        drawLadders();
        drawSnakes();
    });

    $("#id-snl-current-score").bind('click', function() {
        $("#id-snl-win-modalLabel > i").text(" Currect Score");
        for (var i = 1; i <= totalPlayers; ++i){
            $("#id-snl-result-p" + i + " i").text(" "+Player[i]+": "+PlayerPosition[i]);
        }
    });
}(jQuery);

/*
// Player name change form
*/
function nameEditSetup(el, p) {
    var parent = el.parent();
    var grandparent = parent.parent();
    var tick = parent.next();
    var name = el.val().trim();

    grandparent.addClass("has-success");
    if (name.length === 0){
        grandparent.removeClass("has-success").addClass("has-error");
        tick.removeClass("glyphicon-ok").addClass("glyphicon-warning-sign");
    }else{
        grandparent.removeClass("has-error").addClass("has-success");
        tick.removeClass("glyphicon-warning-sign").addClass("glyphicon-ok");
    }
}
function nameFocusoutSetup(el, p) {
    var parent = el.parent();
    var grandparent = parent.parent();
    var tick = parent.next();
    var name = el.val().trim();

    if (name.length === 0){
        name = Player[p];
    }else{
        Player[p] = name;
    }
    el.attr("placeholder", name);
    el.val(name);
    grandparent.removeClass("has-error").removeClass("has-success");
    tick.removeClass("glyphicon-warning-sign").removeClass("glyphicon-ok");
}

+function ($) {
    $(document).on("keyup", "#id-snl-players-names-p1", function(event){
        var el = $("#id-snl-players-names-p1");
        nameEditSetup(el, 1);
    });
    $(document).on("focusout", "#id-snl-players-names-p1", function(event){
        var el = $("#id-snl-players-names-p1");
        nameFocusoutSetup(el, 1);
    });

}(jQuery);

+function ($) {
    $(document).on("keyup", "#id-snl-players-names-p2", function(event){
        var el = $("#id-snl-players-names-p2");
        nameEditSetup(el, 2);
    });
    $(document).on("focusout", "#id-snl-players-names-p2", function(event){
        var el = $("#id-snl-players-names-p2");
        nameFocusoutSetup(el, 2);
    });
}(jQuery);

+function ($) {
    $(document).on("keyup", "#id-snl-players-names-p3", function(event){
        var el = $("#id-snl-players-names-p3");
        nameEditSetup(el, 3);
    });
    $(document).on("focusout", "#id-snl-players-names-p3", function(event){
        var el = $("#id-snl-players-names-p3");
        nameFocusoutSetup(el, 3);
    });
}(jQuery);

+function ($) {
    $(document).on("keyup", "#id-snl-players-names-p4", function(event){
        var el = $("#id-snl-players-names-p4");
        nameEditSetup(el, 4);
    });
    $(document).on("focusout", "#id-snl-players-names-p4", function(event){
        var el = $("#id-snl-players-names-p4");
        nameFocusoutSetup(el, 4);
    });

}(jQuery);

+function ($) {
    'use strict';
    $("#id-snl-dice").bind('click', function() {
        if (!gameEnded){
            postDiceRoll();

            if (!ongoingMove){
                for (var i = 1; i <= totalPlayers; ++i){
                    $("#id-snl-player-" + i).removeClass( "active");
                }
                setTimeout(function(){
                    $("#id-snl-player-" + currentPlayer).addClass( "active");
                }, 1500);
                highlightNextCell();
            }
        }
        if(gameEnded){
            setTimeout(function(){
                showWinModal();
            }, 1000);

        }
    });
}(jQuery);
