import {Rect} from './rect.js'

export function Platform(x, y, w, h, fS, type, grass, ctx, path) {
	this.rect = new Rect(x, y, w, h, fS, ctx);
	this.type = type;
	if (path) this.path = path;
	this.point = 0;
	this.reached = false;


	if (grass) {
		this.gRect = new Rect(this.rect.x,this.rect.y,this.rect.w,15, '#B7CA62', ctx);
	}
	this.drawPlatform = function() {
		
		this.rect.draw();
		if (this.gRect) {
			this.gRect.x = this.rect.x;
			this.gRect.y = this.rect.y;
			this.gRect.draw();
		}
		// context.drawImage(cliff,
		// 	0, 0, this.w, this.h,
		// 	this.x-(this.w/2), this.y-(this.h/2), this.w*2.5, this.h*2);

	}

	this.draw = function() {
		if (this.path.length > 1) {

			let nextPoint = (this.point + 1) % this.path.length;

			let xSpeed = (this.path[nextPoint].x - this.rect.x > 0) ? 1 : -1;
			let ySpeed = (this.path[nextPoint].y - this.rect.y > 0) ? 1 : -1;
			// console.log("this.path[].x: ", this.path[nextPoint].x);
			// console.log("this.rect.x: ", this.rect.x);
			// console.log("xSpeed: ", xSpeed);
			// console.log("this.path[].y: ", this.path[nextPoint].y);
			// console.log("this.rect.y: ", this.rect.y);
			// console.log("ySpeed: ", ySpeed);
			this.rect.x += xSpeed;
			this.rect.y += ySpeed;
			if (Math.abs(this.path[nextPoint].x - this.rect.x) < 2 && Math.abs(this.path[nextPoint].y - this.rect.y) < 2) {
				this.point++;
			}
			this.drawPlatform();
		} else {
			this.drawPlatform();
		}
	}
}