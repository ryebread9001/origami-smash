export function collisionChecks(a, b){

	if (a.x >= b.x + b.w) {
		return false;
	} else if (a.x + a.w <= b.x) {
		return false;
	} else if (a.y >= b.y + b.h) {
		return false;
	} else if (a.y + a.h <= b.y) {
		return false;
	} else {
		// context.fillStyle = 'blue';
		// context.fillRect(a.x, a.y, a.w, a.h);
		return true;
	}
	
}