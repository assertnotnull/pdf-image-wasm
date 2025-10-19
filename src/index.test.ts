import { convert, saveImages } from ".";

const images = await convert("some url");
await saveImages(images, "output");
