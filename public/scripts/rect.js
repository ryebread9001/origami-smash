export function Rect(x,y,w,h,fS,ctx) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this.fillStyle = fS;
	this.draw = () => {
		ctx.fillStyle = this.fillStyle;
		ctx.fillRect(this.x, this.y, this.w, this.h);
	}
	this.getDims = () => {
		return {
			left : this.x,
			right : this.x + this.w,
			top : this.y,
			bottom : this.y + this.h,
		}
	}
}