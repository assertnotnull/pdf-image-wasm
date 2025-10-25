import { map, pipe, range, toArray, toAsync } from "@fxts/core";
import { Canvas } from "@napi-rs/canvas";
import { err, ok, Result, ResultAsync } from "neverthrow";
import { readFile } from "node:fs/promises";
import type { PDFDocumentProxy } from "pdfjs-dist";

const toUint8Array = (image: Buffer) => {
	return new Uint8Array(image);
};

const toUrl = (url: string) => new URL(url);
const safeUrl = Result.fromThrowable(toUrl, () => ({ message: "Invalid URL" }));

export async function loadPdf(pdf: string | Buffer | Uint8Array | ArrayBuffer) {
	if (typeof pdf === "string") {
		const url = safeUrl(pdf);
		console.log("url", url);
		if (url.isOk()) {
			const resp = await ResultAsync.fromPromise(fetch(pdf), () => ({
				message: "Failed to fetch PDF",
			}));
			if (resp.isOk()) {
				return ok(new Uint8Array(await resp.value.arrayBuffer()));
			}
			return err({ message: resp.error.message });
		} else if (/pdfData:pdf\/([a-zA-Z]*);base64,([^"]*)/.test(pdf)) {
			return ok(new Uint8Array(Buffer.from(pdf.split(",")[1], "base64")));
		} else {
			console.log(`file is a local path: ${pdf}`);
			const res = await ResultAsync.fromPromise(readFile(pdf), () => ({
				message: "Failed to read PDF file",
			}));
			if (res.isOk()) {
				return ok(new Uint8Array(res.value));
			}
			return err({ message: res.error.message });
		}
	} else if (Buffer.isBuffer(pdf)) {
		return ok(new Uint8Array(pdf));
	} else {
		return ok(pdf);
	}
}

export class PdfConverter {
	constructor(
		private document: PDFDocumentProxy,
		private scale: number,
		private pages: number[],
	) {}

	async convert() {
		const isValidPageRange = (pageRange: number[]) =>
			pageRange.every((page) => page > 0 && page <= this.document.numPages);

		if (!isValidPageRange(this.pages)) {
			console.warn(`${this.pages} contains invalid pages, using all pages`);
		}

		const hasCustomPages =
			this.pages.length > 0 && isValidPageRange(this.pages);

		const rangeOfPages = hasCustomPages
			? this.pages
			: range(1, this.document.numPages + 1);

		return pipe(
			rangeOfPages,
			toAsync,
			map((pageNumber) => this.getPageAsImage(pageNumber)),
			map(toUint8Array),
			toArray,
		);
	}

	private async getPageAsImage(pageNumber: number) {
		const page = await this.document.getPage(pageNumber);
		const viewport = page.getViewport({ scale: this.scale });

		const canvas = new Canvas(viewport.width, viewport.height);

		await page.render({ canvas, viewport }).promise;

		return canvas.toBuffer("image/jpeg");
	}
}
