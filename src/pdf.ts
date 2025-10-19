import { Canvas } from "@napi-rs/canvas";
import { Result } from "neverthrow";
import { readFile } from "node:fs/promises";
import type { PDFDocumentProxy } from "pdfjs-dist";

export const getPageAsImage = async (
	document: PDFDocumentProxy,
	pageNumber: number,
	scale: number,
) => {
	const page = await document.getPage(pageNumber);
	const viewport = page.getViewport({ scale });

	const canvas = new Canvas(viewport.width, viewport.height);
	canvas.width = viewport.width;
	canvas.height = viewport.height;

	await page.render({ canvas, viewport }).promise;

	const image = canvas.toBuffer("image/jpeg");
	return image;
};

export const toUint8Array = (image: Buffer) => {
	return new Uint8Array(image);
};

const toUrl = (url: string) => new URL(url);
const safeUrl = Result.fromThrowable(toUrl, () => ({ message: "Invalid URL" }));

export async function getPdf(pdf: string | Buffer | Uint8Array | ArrayBuffer) {
	if (typeof pdf === "string") {
		const url = safeUrl(pdf);
		if (url.isOk()) {
			const resp = await fetch(pdf);
			return new Uint8Array(await resp.arrayBuffer());
		} else if (/pdfData:pdf\/([a-zA-Z]*);base64,([^"]*)/.test(pdf)) {
			return new Uint8Array(Buffer.from(pdf.split(",")[1], "base64"));
		} else {
			return new Uint8Array(await readFile(pdf));
		}
	} else if (Buffer.isBuffer(pdf)) {
		return new Uint8Array(pdf);
	} else {
		return pdf;
	}
}
