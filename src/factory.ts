import { Canvas } from "@napi-rs/canvas";
import assert from "node:assert";

export class CanvasWrapper {
	private canvas: Canvas;
	constructor(width: number, height: number) {
		assert(width > 0 && height > 0, "Invalid canvas size");
		this.canvas = new Canvas(width, height);
	}

	reset(width: number, height: number) {
		assert(width > 0 && height > 0, "Invalid canvas size");
		this.canvas.width = width;
		this.canvas.height = height;
	}
}
