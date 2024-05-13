import {Rect} from './rect.js'
import { collisionChecks } from './collision.js';

export function Enemy(id, rect, ctx) {

    this.id = id;
	this.size = 20;
	this.rect = new Rect(rect.x, rect.y, rect.w, rect.h, rect.fillStyle, ctx);

	this.batReady = false;
    this.batSwing = false;
	this.batFrame = 0;
	this.batCharge = 0;
    this.dir = 0;

	// this.drawBatDir = function() {
		
	// 	ctx.fillStyle = "black";
	// 	if (this.dir == 1 && this.ySpeed < -1) {
	// 		ctx.fillRect(this.rect.x+this.rect.w+8,this.rect.y-8,4,4)
	// 		console.log("upper right")
	// 	} else if (this.dir == -1 && this.ySpeed < -1) {
	// 		console.log("upper left")
	// 		ctx.fillRect(this.rect.x-8,this.rect.y-8,4,4)
	// 	} else {
	// 		ctx.fillRect(this.rect.x+this.rect.w+4,this.rect.y-this.w/2,16,4)
	// 	}

	// 	//ctx.fillRect(this.rect.x,this.rect.y,20,4);
	// }

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
			this.batReady = false;
			this.batFrame = 0;
			this.batCharge = 0;
		}
	}

    this.getFrame = function(rect, batReady, batIsSwing, dir) {
        this.rect.x = rect.x;
        this.rect.y = rect.y;
        this.rect.w = rect.w;
        this.rect.h = rect.h;
        this.rect.fillStyle = rect.fillStyle;
        this.batReady = batReady;
        this.batIsSwing = batIsSwing;
        this.dir = dir;
    }

	this.checkAttackHit = function(player1) {
		if (this.batIsSwing) {
			
			let attackBox = {
				x: (this.dir == 1) ? this.rect.x + (2*this.rect.w) : this.rect.x - this.rect.w,
				y: this.rect.y,
				w: this.rect.w,
				h: this.rect.h
			}
			if (collisionChecks(attackBox, player1.rect)) {
				return {dir: this.dir, charge: this.batCharge}
			} else {
				return false
			}
		} else {
			return false
		}
	}

  	this.update = function() {
        if (this.batReady) this.drawBatReady();
        if (this.batIsSwing) this.batSwing();
        //console.log(this.rect);
		ctx.fillStyle = this.rect.fillStyle;
        ctx.fillRect(this.rect.x,this.rect.y,20,20);
        this.rect.draw();
	}
}