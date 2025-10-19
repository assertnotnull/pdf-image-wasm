import { Canvas } from "@napi-rs/canvas";
import { err, ok, Result, ResultAsync } from "neverthrow";
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

	await page.render({ canvas, viewport }).promise;

	return toUint8Array(canvas.toBuffer("image/jpeg"));
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
