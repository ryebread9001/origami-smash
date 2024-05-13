"use strict";
import {Player} from './player.js'
import {Platform} from './platform.js'
import {Enemy} from './enemy.js'
import map from './map.json' with { type: 'json' };

const socket = io('', {transports: ['websocket']});

const messages = document.getElementById("messages");
const chatInput = document.getElementById("chat-input");
const chatSubmit = document.getElementById("chat-submit");
const chatForm = document.getElementById("chat-form");

function sendMsg() {
	console.log("chatSubmit: ", chatSubmit);
	let obj = {}
	obj.msg = chatInput.value;
	socket.emit("chat", obj);
	chatInput.value = "";
}

chatSubmit.addEventListener("click", (e)=>{
	e.preventDefault();
	sendMsg();
}, false);

chatForm.addEventListener('submit', (e) => {
	e.preventDefault();
	sendMsg();
}, false);

socket.on("connect", () => {
	console.log("connected", socket.id);
})

socket.on("newChat", (chat) => {
	let newChatSpan = document.createElement('p');
	newChatSpan.innerText = chat.name + ": " + chat.msg;
	messages.appendChild(newChatSpan);
	if (messages.children.length > 6) {
		messages.children[0].remove();
	}
})

let players = [];

socket.on("players", (serverPlayers) => {
	//console.log(serverPlayers);
	Object.values(serverPlayers).forEach((srvPlyr)=>{
		let findPlayer = players.find((plyr)=>plyr.id==srvPlyr.id);
		//console.log(findPlayer);
		if (findPlayer == undefined && srvPlyr.id != socket.id) {
			console.log(srvPlyr.data.rect)
			players.push(new Enemy(srvPlyr.id, srvPlyr.data.rect, context));
			//console.log(players);
		} else if (findPlayer != undefined) {
			//console.log(findPlayer);
			findPlayer.getFrame(srvPlyr.data.rect, srvPlyr.data.batReady, srvPlyr.data.batIsSwing, srvPlyr.data.dir);
		}
	})
	
	//console.log(players);
})

socket.on("playerDisconnect", (id) => {
	players = players.filter((plyr)=>plyr.id!=id);
})

var backgroundCanvas = document.getElementById("background-layer");
var bGContext = backgroundCanvas.getContext('2d');
var uiCanvas = document.getElementById("ui-layer");
var uiContext = uiCanvas.getContext('2d');
var canvas = document.getElementById("game-layer");
var context = canvas.getContext("2d");
canvas.width = 600;
canvas.height = 600;
let width = canvas.width;
let height = canvas.height;

let contexts = {
    'bGContext': bGContext,
    'uiContext': uiContext,
    'context': context
}

let paper = document.getElementById('paper');
let paperSoft = document.getElementById('paper-soft');

let stageColor = '#081b1f';
let blockColor = '#111733';

const grad= bGContext.createLinearGradient(0,0,0,1000);
grad.addColorStop(0, '#c5bfa1');
grad.addColorStop(0.3749, '#c5ffff');
grad.addColorStop(0.375, '#85cfd6');
grad.addColorStop(0.5749, '#a5fff6');
grad.addColorStop(0.575, '#45518f');
grad.addColorStop(0.77499, '#516D8A');
grad.addColorStop(0.775, '#010D0A');
grad.addColorStop(0.8499, '#110D1A');
grad.addColorStop(1, 'black');

const dirtGrad = context.createLinearGradient(0,500,0,600);
dirtGrad.addColorStop(0, '#292521');
dirtGrad.addColorStop(1, '#695551');

const paperPattern = bGContext.createPattern(paper, "repeat");
const softPaperPattern = context.createPattern(paperSoft, "repeat");

let fillStyles = {
    'stageColor': stageColor,
    'blockColor': blockColor,
    'grad': grad,
    'dirtGrad': dirtGrad,
    'paperPattern': paperPattern,
    'softPaperPattern': softPaperPattern
}

const activePlayers = document.getElementById('active-players');
const score = document.getElementById('score');
const usernameInput = document.getElementById("username-input");

usernameInput.addEventListener("keyup", (e) => {
	socket.emit("name", usernameInput.value);
})



const controlMapper = {
	'main' : { left: false, up: false, right: false, down: false, bat: false },
	'second' : { left: false, up: false, right: false, down: false }
}

let plats = [];
let player1 = new Player(350,250,'#cf324f',1, context, controlMapper);
function initMap(mapJSON) {
    let currMap = mapJSON.map2;
    
	
    currMap.platforms.forEach((plat)=>{
        if (plat.move) {
			
			plats.push(new Platform(plat.x, plat.y, plat.w, plat.h, fillStyles[plat.fS], plat.type, plat.grass, contexts[plat.context], plat.path));
		} else {
			plats.push(new Platform(plat.x, plat.y, plat.w, plat.h, fillStyles[plat.fS], plat.type, plat.grass, contexts[plat.context], []));
		}
	})
}
//plats.push(new Platform(100, 500, 400, 30, dirtGrad, '', true, context));

function draw() {
	// clear frame
	try {
		context.clearRect(0, 0, width, height);



		for (var i = 0; i < plats.length; i++) {
			plats[i].draw();
		}

		socket.emit('update', {'rect':{
            x: player1.rect.x, y: player1.rect.y, w: player1.rect.w, h: player1.rect.h, fillStyle: player1.rect.fillStyle      
        }, 'batReady':player1.batReady, 'batIsSwing':player1.batIsSwing, 'dir':player1.dir});
		player1.update(plats);
		

		players.forEach((plyr) => { // draw enemies
			plyr.update();
			let attackCheck = plyr.checkAttackHit(player1)
			if (attackCheck != false) {
				console.log(attackCheck);
				player1.isHit = true;
				if (player1.xSpeed == 0) player1.xSpeed = 2 * attackCheck.dir;
				player1.xSpeed *= attackCheck.dir * (attackCheck.charge/5);
				player1.ySpeed -= 5;
			}
		})
		
		context.fillStyle = softPaperPattern;
		context.fillRect(0,0,1000,1000);
	} catch (err) {
		console.log(err);
	}
	
	//console.log("finished draw");
}

let frames = 0;
let sec = 0;
let msPrev = window.performance.now()
let msPerFrame = 1000 / 100; // 1000ms / fps = ms per frame

document.body.onload = function() {
    initMap(map);

	// BACKGROUND SETUP
	bGContext.fillStyle = grad;
	bGContext.fillRect(0,0,1000,1000);
	bGContext.fillStyle = paperPattern;
	bGContext.fillRect(0,0,1000,1000);

    function gameLoop() {
		window.requestAnimationFrame(gameLoop);
        //console.log(frames);
        frames++;	
        const msNow = window.performance.now()
        const msPassed = msNow - msPrev
        //console.log(frames/ msPassed);
        if (msPassed < msPerFrame) return
        const excessTime = msPassed % msPerFrame
        msPrev = msNow - excessTime
        draw();
    }

    window.requestAnimationFrame(gameLoop); // Start game loop
};

function getRandomInt(min,max) {
    return Math.floor((Math.random()*max)+min);
}

let boostTimer = false;
function keyDownHandler(event) {
	if (chatInput != document.activeElement && usernameInput != document.activeElement) {
		if (event.keyCode === 39 || event.keyCode === 68) {
			controlMapper.main.right = true;
		} else if (event.keyCode === 37 || event.keyCode === 65) {
			controlMapper.main.left = true;
		}
		
		if (event.keyCode === 40 || event.keyCode === 83) {
			controlMapper.main.down = true;
		} 
		
		if (event.keyCode === 38 || event.keyCode === 87) {
			controlMapper.main.up = true;
		}

		if (event.keyCode == 32 && !controlMapper.main.bat) {
			controlMapper.main.bat = true;
		}

		if (event.keyCode === 16 && !controlMapper.main.boost  && !boostTimer) {
			//canShoot = true;
			boostTimer = true;
			controlMapper.main.boost = true;
			setTimeout(() => {
				boostTimer = false;
				console.log('boost timer expired');
			}, 1500)
			
		}
		console.log("INPUT: ", event.keyCode);
	}
}

function keyUpHandler(event) {
	if (chatInput != document.activeElement && usernameInput != document.activeElement) {
		if (event.keyCode === 39 || event.keyCode === 68) {
			controlMapper.main.right = false;
		} else if (event.keyCode === 37 || event.keyCode === 65) {
			controlMapper.main.left = false;
		}
		
		if (event.keyCode === 40 || event.keyCode === 83) {
			controlMapper.main.down = false;
		}
		
		if (event.keyCode === 38 || event.keyCode === 87) {
			controlMapper.main.up = false;
		}
		if (event.keyCode === 32) {
			controlMapper.main.bat = false;
		}
		if (event.keyCode === 16) {

			controlMapper.main.boost = false;
			
		}
	}
}

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);