import { map, pipe, range, toArray, toAsync } from "@fxts/core";
import { writeFile } from "node:fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { getPageAsImage, getPdf, toUint8Array } from "./pdf";

interface ConvertOptions {
	scale?: number;
	pageRange?: number[];
}

/**
 * Convert a PDF to images - scaling to 2x by default
 * @param pdf - The PDF file to convert
 * @param options - The options for the conversion
 * @returns An array of images
 */
export async function convert(
	pdf: string | Buffer | Uint8Array | ArrayBuffer,
	options: ConvertOptions = { scale: 2, pageRange: [] },
) {
	const { scale = 2, pageRange = [] } = options;

	const pdfData = await getPdf(pdf);

	const document = await getDocument({
		data: pdfData,
		disableFontFace: true,
		verbosity: 0,
	}).promise;

	const isValidPageRange = (pageRange: number[]) =>
		pageRange.every((page) => page > 0 && page <= document.numPages);

	if (!isValidPageRange(pageRange)) {
		console.warn(`${pageRange} contains invalid pages, using all pages`);
	}

	const hasCustomPages = pageRange.length > 0 && isValidPageRange(pageRange);

	const rangeOfPages = hasCustomPages
		? pageRange
		: range(1, document.numPages + 1);

	return pipe(
		rangeOfPages,
		toAsync,
		map((pageNumber) => getPageAsImage(document, pageNumber, scale)),
		map(toUint8Array),
		toArray,
	);
}

export async function saveImages(images: Uint8Array[], folder: string) {
	const promises = images.map(async (image, index) => {
		const buffer = Buffer.from(image);
		await writeFile(`./${folder}/page-${index + 1}.jpg`, buffer);
	});
	await Promise.all(promises);
}
