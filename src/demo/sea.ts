import Renderer from "engine/renderer.js";
import Entity from "engine/entity.js";
import World from "engine/world.js";

import Ship from "./ship.js";
import Water from "./water.js";


type Point = [number, number];

export default class Sea extends World {
	readonly ships: Ship[] = [];

	constructor(renderer: Renderer) {
		super(renderer, new Water(renderer));
	}

	add(entity: Entity) {
		switch (true) {
			case entity instanceof Ship:
				let ship = entity as Ship;
				this.ships.push(ship);
				this.renderer.add(ship, 1);
				ship.renderer = this.renderer;
			break;
		}
	}

	remove(entity: Entity) {
		switch (true) {
			case entity instanceof Ship:
				let ship = entity as Ship;
				ship.renderer = undefined;
				this.renderer.remove(ship);
				let index = this.ships.indexOf(ship);
				this.ships.splice(index, 1);
			break;
		}
	}

	has(ship: Ship) {
		return this.ships.includes(ship);
	}

	query(point: Point) {
		return this.ships.find(ship => ship.query(point));
	}
}
