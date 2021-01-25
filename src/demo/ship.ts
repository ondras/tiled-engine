import { DIRS } from "engine/utils.js";
import Entity, { RenderableBitmap } from "engine/entity.js";
import Sea from "./sea.js";
import { RenderData } from "engine/renderer.js";
import { stringToCharArray, ensure } from "engine/utils.js";
import * as bitmap from "engine/bitmap.js";

import * as palette from "./palette.js";


type Point = [number, number];

interface Template {
	chars: string;
	origin: Point;
}

let BITMAPS = [{chars: String.raw`
111
1111
11111
 1111
  11
`,
	origin: [2, 2] as Point
}, {chars: String.raw`
  1
 111
 111
11111
 111
 111
`,
	origin: [2, 3] as Point
}].map(toBitmap);


export default class Ship extends Entity {
	constructor() {
		let bitmaps: RenderableBitmap[] = [];

		for (let i=0;i<8;i++) {
			if (i<BITMAPS.length) {
				bitmaps.push(bitmap.clone(BITMAPS[i]));
			} else {
				let defaultIndex = (i % 2);
				let defaultBitmap = (BITMAPS[defaultIndex]);
				let amount = (i-defaultIndex)/2;
				let rotated = bitmap.rotate(defaultBitmap, amount);
				bitmaps.push(rotated);
			}
		}

		super(bitmaps);
	}

	forward(sea: Sea) {
		const dir = DIRS[this.orientation];
		let newPosition: Point = [
			this.position[0] + dir[0],
			this.position[1] + dir[1]
		];

		if (this.fits(sea, newPosition, this._orientation)) { this.position = newPosition; }
	}

	rotate(diff: 1 | -1) {
		this.orientation = (this.orientation+diff+8) % 8;
	}
}

export class CenteringShip extends Ship {
	get position() { return super.position; }

	set position(position: Point) {
		this._position = position;
		if (this.renderer) { this.renderer.center = position; }
	}
}

function toBitmap(template: Template): RenderableBitmap {
	let data: ({type:string, renderData:RenderData} | null)[][] = [];

	stringToCharArray(template.chars).forEach((row, y) => {
		row.forEach((ch, x) => {
			ensure(data, x, y);
			if (ch == " ") {
				data[y][x] = null;
			} else {

				data[y][x] = {
					type: ch,
					renderData: {
						ch: 0,
						fg: 0,
						bg: palette.BROWN_LIGHT
					}
				};
			}
		});
	});

	return { data, origin: template.origin };
}
