
const express = require('express');
const { createServer } = require("http")
const { Server } = require("socket.io")

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, { 
	cors: {
		origin: "http://localhost:3000"
	}
})

const TICK_RATE = 60
let tickCount = 0

let players = {}

function guidGenerator() {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

function Player(id) {
    this.id = id;
    this.data = {
        rect : {
            x: 0, y: 0, w: 20, h: 20, fillStyle: "#cf324f"
        },
        batReady: false,
        batIsSwing: false,
        dir: 0
    }
}

function tick() {
    tickCount++

    // for (const player of players) { // main logic loop
    //     //player logic
    // }
    // return to client
    //console.log(players);

    io.emit("players", players);
    //console.log("Active Players: ", Object.keys(players).length);
}

io.on("connect", (socket) => {
    console.log("user connected", socket.id);
    players[socket.id] = new Player(socket.id);
    

    socket.on("update", (player) => {
        players[socket.id].data = player;
    })

    
    socket.on("name", (name) => {
        console.log(name)
        if (name.length < 20) players[socket.id].name = name;
    })

    socket.on("chat", (chat) => {
        console.log(chat)
        if (players[socket.id].name) {
            chat.name = players[socket.id].name
        } else {
            chat.name = socket.id;
        }
        io.emit("newChat", chat)
    })

    socket.on("disconnect", () => {
        delete players[socket.id];
        io.emit("playerDisconnect", socket.id)
        console.log(players)
        console.log('Socket disconnected')
    })
})

app.use(require('cors')())
app.use(express.static("public"))

httpServer.listen(3000)

setInterval(tick, 1000/TICK_RATE)
