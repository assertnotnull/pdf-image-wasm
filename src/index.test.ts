import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { convert } from ".";
import { rm, rmdir, writeFile } from "node:fs/promises";
import { afterEach } from "node:test";
import { ok } from "neverthrow";
import { mkdir } from "node:fs/promises";

async function saveImages(images: Uint8Array[], folder: string) {
	const promises = images.map(async (image, index) => {
		const buffer = Buffer.from(image);
		await writeFile(`./${folder}/page-${index + 1}.jpg`, buffer);
	});
	await Promise.all(promises);
}

async function loadSamplePdf(): Promise<Uint8Array> {
	const pdfPath = "./fixture/sample.pdf";
	const buffer = await Bun.file(pdfPath).arrayBuffer();
	return new Uint8Array(buffer);
}

async function createOutputDir(dir: string) {
	try {
		await mkdir(dir, { recursive: true });
	} catch (error) {
		if ((error as { code?: string }).code !== "EEXIST") {
			throw error;
		}
	}
}

describe("convert", () => {
	afterAll(() => {
		mock.clearAllMocks();
	});

	describe("with mocks", () => {
		afterEach(() => {
			mock.restore();
		});

		it("should convert a PDF to images", async () => {
			mock.module("./pdf", () => ({
				loadPdf: mock(async () => {
					return ok(await loadSamplePdf());
				}),
				PdfConverter: mock(() => ({
					convert: mock(async () => {
						return [new Uint8Array(Buffer.from("test"))];
					}),
				})),
			}));
			const images = await convert("https://pdfobject.com/pdf/sample.pdf");

			expect(images.length).toBe(1);
		});

		it("should convert a base64 PDF string to images", async () => {
			mock.module("./pdf", () => ({
				loadPdf: mock(async () => {
					return ok(await loadSamplePdf());
				}),
				PdfConverter: mock(() => ({
					convert: mock(async () => {
						return [new Uint8Array(Buffer.from("test"))];
					}),
				})),
			}));
			const base64Pdf = "data:pdf/plain;base64,dGVzdA==";
			const images = await convert(base64Pdf);

			expect(images.length).toBe(1);
		});
	});

	describe("with local file input", () => {
		it("should convert a PDF local file to images", async () => {
			const images = await convert("./fixture/sample.pdf");
			const outputDir = "test-output";
			await createOutputDir(outputDir);
			await saveImages(images, outputDir);
			expect(images.length).toBe(1);
		});

		afterAll(async () => {
			await rm("./test-output", { recursive: true });
		});
	});
});
