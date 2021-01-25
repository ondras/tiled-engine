import * as test from "engine/test.js";
import Port, { init as initPort } from "engine/port.js";
import { DIRS, sleep } from "engine/utils.js";

import Sea from "./sea.js";
import Ship from "./ship.js";
import TimeLoop, { Actor } from "engine/timeloop.js";
import { palette } from "./palette.js";


class Captain implements Actor {
	constructor(private ship: Ship) {}

	async act(sea: Sea) {
		let ship = this.ship;
		let position = ship.position;
		let orientation = ship.orientation;

		if (Math.random() > 0.3) {
			const dir = DIRS[orientation];
			position = [
				position[0] + dir[0],
				position[1] + dir[1]
			];
		} else {
			orientation = (orientation + (Math.random() > 0.5 ? 1 : -1) + 8) % 8;
		}

		if (ship.fits(sea, position, orientation)) {
			ship.position = position;
			ship.orientation = orientation;
		}

		await sleep(10);
		return 100;
	}
}

function randomOrientation() {
	return Math.floor(Math.random()*8);
}

function initShips(sea: Sea, loop: TimeLoop) {
	for (let i=-1;i<=1;i++) {
		for (let j=-1;j<=1;j++) {
			if (!i || !j) continue;
			let ship = new Ship();
			ship.position = [i*15, j*15];
			ship.orientation = randomOrientation();
			sea.add(ship);

			loop.add(new Captain(ship));
		}
	}
}

async function init() {
	await initPort();
	let port = Port.bestSize(document.body, 200, palette);
	let sea = new Sea(port.renderer);

	let loop = new TimeLoop();

	initShips(sea, loop);
	loop.start(sea);

}

init();
test.runAndLog();
