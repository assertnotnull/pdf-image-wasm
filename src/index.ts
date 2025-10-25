import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { loadPdf, PdfConverter } from "./pdf";

interface ConvertOptions {
	scale?: number;
	pages?: number[];
}

/**
 * Convert a PDF to images - scaling to 2x by default
 * @param pdf - The PDF file to convert
 * @param options - The options for the conversion
 * @returns An array of images
 */
export async function convert(
	pdf: string | Buffer | Uint8Array | ArrayBuffer,
	options: ConvertOptions = { scale: 2, pages: [] },
) {
	const { scale = 2, pages = [] } = options;

	const pdfResult = await loadPdf(pdf);
	if (pdfResult.isErr()) {
		throw new Error(pdfResult.error.message);
	}

	const document = await getDocument({
		data: pdfResult.value,
		disableFontFace: true,
		verbosity: 0,
	}).promise;

	const converter = new PdfConverter(document, scale, pages);
	return converter.convert();
}
