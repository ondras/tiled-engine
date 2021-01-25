import Renderer from "./renderer.js";
import { Palette } from "fastiles";


type Point = [number, number];

const FONT_SIZES = [6, 8, 10, 12, 14, 16, 18, 20];
const DPR = window.devicePixelRatio;
const FONTS: Record<number, HTMLImageElement | HTMLCanvasElement> = {};

async function loadImage(src: string) {
	let img = new Image();
	img.src = src;
	await img.decode();
	return img;
}

function adjustByDPR(size: number) {
	let adjusted = Math.round(size * DPR);
	if (!(adjusted in FONTS)) {
		const source = FONTS[size];
		let canvas = document.createElement("canvas");
		canvas.width = source.width * DPR;
		canvas.height = source.height * DPR;

		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
		FONTS[adjusted] = canvas;
	}

	return adjusted;
}

function computeSceneOptions(node: HTMLElement, tileSize: number) {
	let adjustedTileSize = adjustByDPR(tileSize);
	let tileCount = computeTileCount(node, tileSize);

	console.log("setTileSize", tileSize, adjustedTileSize);
	console.log("tileCount", tileCount);

	return {
		tileCount,
		tileSize: [adjustedTileSize, adjustedTileSize] as Point,
		font: FONTS[adjustedTileSize]
	};
}

function computeTileCount(node: HTMLElement, tileSize: number) {
	return [node.offsetWidth, node.offsetHeight].map(size => {
		let tiles = Math.ceil(size/tileSize);
		if (tiles % 2 == 0) { tiles++; } // need odd number
		return tiles;
	}) as Point;
}

export async function init() {
	let promises = FONT_SIZES.map(size => loadImage(`font/${size}.png`));
	let images = await Promise.all(promises);
	images.forEach((image, i) => FONTS[FONT_SIZES[i]] = image);
}

export default class Port {
	readonly renderer: Renderer;

	static bestSize(parent: HTMLElement, tileCountHorizontal: number, palette: Palette) {
		const idealSize = parent.offsetWidth / tileCountHorizontal;
		const bts = FONT_SIZES.slice().sort((a, b) => Math.abs(a-idealSize) - Math.abs(b-idealSize))[0];
		console.log("bestTileSize for", tileCountHorizontal, "is", bts);

		return new this(parent, bts, palette);
	}

	constructor(private parent: HTMLElement, private tileSize: number, palette: Palette) {
		let options = computeSceneOptions(parent, tileSize);
		this.renderer = new Renderer(options, palette);
		parent.appendChild(this.renderer.node);
		this.updateSceneSize(options.tileCount);

		window.addEventListener("resize", _ => {
			let tileCount = computeTileCount(this.parent, this.tileSize);
			this.renderer.configure({tileCount});
			this.updateSceneSize(tileCount);
		});
	}

	private setTileSize(tileSize: number) {
		this.tileSize = tileSize;
		let options = computeSceneOptions(this.parent, tileSize);
		this.renderer.configure(options);
		this.updateSceneSize(options.tileCount);
	}

	private updateSceneSize(tileCount: Point) {
		const node = this.renderer.node;
		const width = tileCount[0] * this.tileSize;
		const height = tileCount[1] * this.tileSize;
		node.style.width = `${width}px`;
		node.style.height = `${height}px`;

		node.style.left = `${(this.parent.offsetWidth-width)/2}px`;
		node.style.top = `${(this.parent.offsetHeight-height)/2}px`;
	}
}
