const { randomInt } = require('crypto');
const express = require('express');
const { createServer } = require("http")
const { Server } = require("socket.io")
const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, { 
	cors: {
		origin: "https://lyssie.org"
	}
})

const TICK_RATE = 30
let tickCount = 0

let players = []
const inputsMap = {}
let arrows = []
const arrowLong = 40
const arrowShort = 5

let width = 1000
let height = 1000

const friction = 0.75
const walkingSpeed = 1.7
let tileNum = 25
let tileSize = width / tileNum
const playerSize = tileSize-1

const scale = 1
const pWidth = playerSize
const pHeight = playerSize
const scaledWidth = scale * pWidth
const scaledHeight = scale * pHeight
const platNum = 60
const arrowSpeed = 18

function guidGenerator() {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}
/*
{
        id: socket.id,
        xCenter: 500-(playerSize/2),
        yCenter: 500-(playerSize/2),
        xSpeed: 0,
        ySpeed: 0,
        dir: 0,
        size: playerSize,
        name: "",
        arrows: [],
        canShoot: true
    }
*/
function Player(id) {
    this.id = id
    this.xCenter = 500-(playerSize/2),
    this.yCenter = 500-(playerSize/2),
    this.xSpeed = 0,
    this.ySpeed = 0,
    this.dir = 0,
    this.size = playerSize,
    this.name = "",
    this.arrows = [],
    this.canShoot = true,
    this.score = 0,
    //this.dead = false

    this.respawn = function() {
        this.xCenter = randomInt(0, width);
        this.yCenter = randomInt(0, height);
        this.score = 0;
        //this.dead = true;
    }
}

function Platform(x, y, w, h, color, type) {
	this.x = x
	this.y = y
	this.w = w
	this.h = h
	this.color = color
	this.type = type
}

function Arrow(x, y, dir, id, owner) {
	this.x = x
	this.y = y
	this.dir = dir
    this.ticksAlive = 0
    this.id = id
    this.dead = false
    this.owner = owner
    this.update = function() {
        if (this.dir == 0) { // down
            this.y += arrowSpeed
            this.w = arrowShort
            this.h = arrowLong
        } else if (this.dir == 1) { // up
            this.y -= arrowSpeed
            this.w = arrowShort
            this.h = arrowLong
        } else if (this.dir == 2) { // left
            this.x -= arrowSpeed
            this.w = arrowLong
            this.h = arrowShort
        } else if (this.dir == 3) { // right
            this.x += arrowSpeed
            this.w = arrowLong
            this.h = arrowShort
        }
        this.ticksAlive++;
    }
    this.checkForPlatCol = function(plats) {
        for (var i = 0; i < plats.length; i++) {
            let col = isCollideArrow(this, plats[i])
            if (col.col) {
                console.log("arrow col")
                this.ticksAlive = 49;
            }
        }
    }
}

function getRandomInt(min,max) {
    return Math.floor((Math.random()*max)+min);
}

function compare( a, b ) {
	if ( a.y < b.y ){
		return -1
	}
	if ( a.y > b.y ){
		return 1
	}
	return 0
}

function platformRandom() {
	let plats = []
	for (var i = 0; i < platNum; i++) {
		plats[i] = new Platform(getRandomInt(1,tileNum)*tileSize-tileSize/2,
		getRandomInt(1,tileNum)*tileSize-tileSize/2,
		tileSize-1,
		tileSize-1, 'white', 'plat');
	}
	plats.sort( compare )
	return plats
}

const map = platformRandom()

function getDims(a, b) {
	return {
		playerLeft : a.xCenter - a.size/2,
		playerRight : a.xCenter + a.size/2,
		playerTop : a.yCenter - a.size/2,
		playerBottom : a.yCenter + a.size/2,
		platformLeft : b.x - b.w/2,
		platformRight : b.x + b.w/2,
		platformTop : b.y - b.h/2,
		platformBottom : b.y + b.h/2
	}
}

function isCollide(a, b){
	let d = getDims(a, b)
	return {
		'col' : (d.playerBottom > d.platformTop &&
		 d.playerTop < d.platformBottom &&
		 d.playerLeft < d.platformRight &&
		 d.playerRight > d.platformLeft),
		'xCol' : (d.playerLeft < d.platformRight &&
		d.playerRight > d.platformLeft),
		'xColR' : (d.playerRight > d.platformLeft) && (d.playerRight < (d.platformRight - b.w/2)),
		'xColL' : (d.playerLeft < d.platformRight) && (d.playerLeft > (d.platformLeft + b.w/2)),
		'yCol' : (d.playerBottom > d.platformTop &&
		 d.playerTop < d.platformBottom),
		'yColB' : (d.playerBottom > d.platformTop) && (d.playerBottom < (d.platformBottom - b.h/2)),
 		'yColT' : (d.playerTop < d.platformBottom) && (d.playerTop > (d.platformTop + b.h/2)),
	};
}

function getArrPlatDims(a , b) {
    return {
		arrowLeft : a.x,
		arrowRight : a.x + a.w/2,
		arrowTop : a.y,
		arrowBottom : a.y + a.h/2,
		platformLeft : b.x - b.w/2,
		platformRight : b.x + b.w/2,
		platformTop : b.y - b.h/2,
		platformBottom : b.y + b.h/2
	}
}

function isCollideArrow(a, b) {
    let d = getArrPlatDims(a , b)
    return {
        'col' : (d.arrowBottom > d.platformTop &&
            d.arrowTop < d.platformBottom &&
            d.arrowLeft < d.platformRight &&
            d.arrowRight > d.platformLeft)
    }
}

function checkCollisionForPlayer(player, plats) {

    for (var j = 0; j < arrows.length; j++) {
        if (arrows[j].owner != player.id) {
            let col = isCollide(player, arrows[j])
            if (col.col) {
                console.log("arrow col");
                players.find((plyr)=>plyr.id == arrows[j].owner).score++
                arrows[j].ticksAlive = 49;
                player.respawn()
            }
        }
    }

    for (var i = 0; i < plats.length; i++) {
        let col = isCollide(player, plats[i])
        if (col.col) {
            let triggered = false

            let d = getDims(player, plats[i])

            if (col.yCol && col.yColB && !triggered) {
                player.ySpeed = 0
                //player1.xSpeed = 0;
                player.yCenter = d.platformTop - player.size/2 - 1
                //console.log('Bottom');
                triggered = true
            }
            if (col.xCol && col.xColL && !triggered) {
                player.xSpeed = 0
                //player1.ySpeed = 0;
                player.xCenter = d.platformRight + player.size/2 + 1
                //console.log('Left');
                triggered = true
            }
            if (col.xCol && col.xColR && !triggered) {
                player.xSpeed = 0
                //player1.ySpeed = 0;
                player.xCenter = d.platformLeft - player.size/2 - 1
                //console.log('Right');
                triggered = true
            }
            if (col.yCol && col.yColT && !triggered) {
                player.ySpeed = 0
                //player1.xSpeed = 0;
                player.yCenter = d.platformBottom + player.size/2 + 1
                //console.log('Top');
                triggered = true
            }
            //(triggered);
        }
    }
}

function setShoot(player) {
    setTimeout(()=>player.canShoot = true, 1000)
}

function tick() {
    tickCount++
    // console.log(tickCount)
    if (arrows.length > 0) {
        arrows.forEach((arw)=>{
            arw.update()
            arw.checkForPlatCol(map)
            if (arw.dead) {
                const i = arrows.indexOf(arw);
                arrows.splice(i, 1)
            } else if (arw.ticksAlive > 48) {
                arw.dead = true
            }
        })
        io.emit("arrows", arrows);
    }

    for (const player of players) { // main logic loop

        if (inputsMap[player.id].shoot && player.canShoot) {
            // console.log("got shoot input");
            arrows.push(new Arrow(player.xCenter, player.yCenter, player.dir, guidGenerator(), player.id))
            inputsMap[player.id].shoot = false
            player.canShoot = false
            setShoot(player)
            //console.dir(arrows)
        }
        

        if (inputsMap[player.id].left) {
            player.xSpeed -= walkingSpeed
            player.dir = 2
        } else {
            //player.xSpeed = 0;
        }
        if (inputsMap[player.id].right) {
            player.xSpeed += walkingSpeed;
            player.dir = 3
        } else {
            //player.xSpeed = 0;
        }
        if (inputsMap[player.id].up) {
            player.ySpeed -= walkingSpeed;
            player.dir = 1
        } else {

        }
        if (inputsMap[player.id].down) {
            player.ySpeed += walkingSpeed;
            player.dir = 0
        } else {

        }

        player.xSpeed*=friction;
        player.ySpeed*=friction;

        player.xCenter+=player.xSpeed;
        player.yCenter+=player.ySpeed;

        checkCollisionForPlayer(player, map);
    }
    // return to client
    io.emit("players", players);
}

io.on("connect", (socket) => {
    console.log("user connected", socket.id);
    players.push(new Player(socket.id));
    inputsMap[socket.id] = {
        left: false,
        up: false,
        right: false,
        down: false,
        shoot: false
    }
    socket.emit("map", map);

    socket.on("inputs", (inputs) => {
        // console.log(socket.id, inputs);
        inputsMap[socket.id] = inputs;
    })

    var foundPlayer = players.find((plyr)=>plyr.id==socket.id)

    socket.on("name", (name) => {
        console.log(name)
        if (foundPlayer) {
            if (name.length < 20) {
                foundPlayer.name = name
            } else {
                foundPlayer.name = socket.id
            }
        }
    })

    socket.on("chat", (chat) => {
        console.log(chat)
        if (foundPlayer && foundPlayer.name) {
            if (foundPlayer.name.length > 16) {
                chat.name = foundPlayer.name.substring(0,15)
            } else {
                chat.name = foundPlayer.name
            }
        } else {
            chat.name = socket.id
        }
        io.emit("newChat", chat)
    })

    socket.on("disconnect", () => {
        let disconnectedId
        players = players.filter((player) => {
            if (player.id !== socket.id) {
                return true;
            } else {
                disconnectedId = player.id
                return false;
            }
        });
        io.emit("playerDisconnect", disconnectedId)
        console.log(players)
        console.log('Socket disconnected')
    })
})

app.use(require('cors')())
app.use(express.static("public"))

httpServer.listen(3000)

setInterval(tick, 1000/TICK_RATE)
