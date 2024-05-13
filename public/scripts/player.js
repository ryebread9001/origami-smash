import {Rect} from './rect.js'
import { collisionChecks } from './collision.js';



export function Player(x, y, color, playerID,ctx,controlMapper) {
	this.xSpeed = 0;
	this.ySpeed = 0;
	this.size = 20;
	this.rect = new Rect(x, y, this.size, this.size, color, ctx);


  	this.color = color;
	this.playerID = playerID;
	this.jumping = false;
	this.playerMaxSpeed = 9;
	this.friction = 0.85;
	this.boost = false;
	this.dir = 0;
	this.ydir = 0;

	this.batReady = false;
	this.batIsSwing = false;
	this.batFrame = 0;
	this.batCharge = 0;

	this.gravity = 1;

	this.drawCharacter = function() {

		this.rect.draw();

	}

	this.respawn = function() {
		this.jumping = true;
		this.ySpeed = 0;
		this.xSpeed = 0;
		this.rect.x = 350;
		this.rect.y = 250;
	}

	this.drawName = function() {
		ctx.font = "small-caps 16px sans-serif";
		ctx.textAlign = "center"
  		ctx.fillText("NAME", this.x, this.y-this.size);
	}

	this.updatesToSend = function() {
		if (Math.abs(this.xSpeed) > 0.1 || Math.abs(this.ySpeed) > 0.1) {
			return true;
		} else {
			return false;
		}
	}

	this.drawBatDir = function() {
		
		ctx.fillStyle = "black";
		if (this.dir == 1 && this.ySpeed < -1) {
			ctx.fillRect(this.rect.x+this.rect.w+8,this.rect.y-8,4,4)
			console.log("upper right")
		} else if (this.dir == -1 && this.ySpeed < -1) {
			console.log("upper left")
			ctx.fillRect(this.rect.x-8,this.rect.y-8,4,4)
		} else {
			ctx.fillRect(this.rect.x+this.rect.w+4,this.rect.y-this.w/2,16,4)
		}

		//ctx.fillRect(this.rect.x,this.rect.y,20,4);
	}

	this.drawBatReady = function() {
		this.batCharge++;
		if (this.batCharge > 100) this.batCharge = 100;
		ctx.fillStyle = '#000000';
		if (this.batFrame == 0) {
			if (this.dir > 0) {
				ctx.fillRect(
					this.rect.x+this.rect.w+4,
					this.rect.y+(this.rect.h/2)-1,
					16,
					4);
			} else {
				ctx.fillRect(
					this.rect.x-4,
					this.rect.y+(this.rect.h/2)-1,
					-16,
					4);
			}
		}
	}

	this.batSwing = function() {
		ctx.fillStyle = '#000000';
		this.batIsSwing = true;
		if (this.dir > 0) {
			ctx.fillRect(
				this.rect.x+this.rect.w+(this.batFrame%5*4)+4,
				this.rect.y+(this.rect.h/2)-1,
				16,
				4);
		} else {
			ctx.fillRect(
				this.rect.x-(this.batFrame%5*4)-4,
				this.rect.y+(this.rect.h/2)-1,
				-16,
				4);
		}
		
		this.batFrame++;
		console.log(this.batFrame);
		if (this.batFrame == 15) {
			this.batIsSwing = false;
			this.batReady = false;
			this.batFrame = 0;
		}
	}

  	this.update = function(plats) {
		if (controlMapper.main.left) {
			if (this.xSpeed > this.playerMaxSpeed * -1) this.xSpeed -= 1;
			this.dir = -1;
		} else if (controlMapper.main.right) {
			if (this.xSpeed < this.playerMaxSpeed) this.xSpeed += 1;
			this.dir = 1;
		}
		
		if (controlMapper.main.up && !this.jumping) {
			this.ydir = -1;
			this.ySpeed = -14;
			this.jumping = true;
		} else if (controlMapper.main.down) {
			this.ydir = 1;
			this.ySpeed += 2;
			//this.jumping = false;
		} 
		
		if (controlMapper.main.boost && !this.boost) {
			if (this.xSpeed > 3 || this.xSpeed < -3 || this.ySpeed > 3 || this.ySpeed < -3) this.boost = true;
		}

		

		let xColBox = {
			'x': this.rect.x + this.xSpeed,
			'y': this.rect.y,
			'w': this.rect.w,
			'h': this.rect.h,
		}
		let yColBox = {
			'x': this.rect.x,
			'y': this.rect.y + this.ySpeed,
			'w': this.rect.w,
			'h': this.rect.h
		}
		plats.forEach((plat)=>{
			if(collisionChecks(xColBox,plat.rect)) {
				this.xSpeed = 0;
				this.jumping = false;
			}
			if (collisionChecks(yColBox,plat.rect)) {
				this.ySpeed = 0;
				if (this.rect.y > plat.rect.y) {
					this.jumping = true
				} else {
					this.jumping = false;
				}
			}
		})

		if (this.boost) {
			//this.jumping = true;
			this.xSpeed *= 3;
			//this.ySpeed *= 1.1;
			if (this.xSpeed > 13) { 
				this.xSpeed = 13;
			} else if (this.xSpeed < -13) {
				this.xSpeed = -13;
			}
			// if (this.ySpeed > 15) {
			// 	this.ySpeed = 15;
			// } else if (this.ySpeed < -15) {
			// 	this.ySpeed = -15;
			// }
			
			
			this.boost = false;
			
		}

		if (controlMapper.main.bat && !this.batReady) {
			this.batReady = true;
			this.jumping = true;
			console.log("READY TO SWING");
		}
		if (controlMapper.main.bat) { 
			this.xSpeed = 0;
			this.gravity = 0.5;
			this.jumping = true;
		}

		this.xSpeed *= this.friction;

//(this.rect.x >= 0) ? Math.floor(this.rect.x) : Math.ceil(this.rect.x);
		this.rect.x += this.xSpeed;
		this.rect.y += this.ySpeed;

		if (Math.abs(this.xSpeed) < 0.5) this.xSpeed = 0;
		if (Math.abs(this.ySpeed) < 0.5) this.ySpeed = 0;
		this.rect.x = Math.floor(this.rect.x);
		this.rect.y = Math.floor(this.rect.y);
		this.ySpeed += this.gravity;
		
		if (this.rect.y > 1500) {
			this.respawn();
		} 
		

		
		this.drawCharacter();

		
		//if (this.batReady) this.drawBatReady();
		if (this.batReady && !controlMapper.main.bat) {
			//batReady = false;
			this.xSpeed += this.dir * (this.batCharge/3);
			console.log("CHARGE: ", this.batCharge);
			this.batCharge = 0;
			this.gravity = 1;
			this.batSwing();
			console.log("SWING");
		} else if (this.batReady) {
			this.drawBatReady();
		}

		this.drawBatDir();
		//this.drawName();
	}
}