import { inflateRawSync } from "node:zlib";

/**
 * Minimal ZIP extractor for stored and deflated entries.
 * VOICEVOX /multi_synthesis returns ZIP archives with WAV files.
 */

export interface ZipEntry {
	name: string;
	data: Buffer;
}

function findEndOfCentralDirectory(data: Buffer): number {
	for (let i = data.length - 22; i >= 0; i--) {
		if (
			data[i] === 0x50 &&
			data[i + 1] === 0x4b &&
			data[i + 2] === 0x05 &&
			data[i + 3] === 0x06
		) {
			return i;
		}
	}
	return -1;
}

export function extractZipEntries(zipBuffer: Buffer): ZipEntry[] {
	const eocdOffset = findEndOfCentralDirectory(zipBuffer);
	if (eocdOffset < 0) {
		throw new Error("Invalid ZIP archive: end of central directory not found");
	}

	const centralDirOffset = zipBuffer.readUInt32LE(eocdOffset + 16);
	const entries: ZipEntry[] = [];
	let offset = centralDirOffset;

	while (offset < eocdOffset) {
		const signature = zipBuffer.readUInt32LE(offset);
		if (signature !== 0x02014b50) break;

		const compressionMethod = zipBuffer.readUInt16LE(offset + 10);
		const compressedSize = zipBuffer.readUInt32LE(offset + 20);
		const uncompressedSize = zipBuffer.readUInt32LE(offset + 24);
		const fileNameLength = zipBuffer.readUInt16LE(offset + 28);
		const extraFieldLength = zipBuffer.readUInt16LE(offset + 30);
		const commentLength = zipBuffer.readUInt16LE(offset + 32);
		const localHeaderOffset = zipBuffer.readUInt32LE(offset + 42);

		const nameStart = offset + 46;
		const name = zipBuffer
			.subarray(nameStart, nameStart + fileNameLength)
			.toString("utf8");

		const localNameStart = localHeaderOffset + 30;
		const localNameLength = zipBuffer.readUInt16LE(localHeaderOffset + 26);
		const localExtraLength = zipBuffer.readUInt16LE(localHeaderOffset + 28);
		const dataStart = localNameStart + localNameLength + localExtraLength;

		let data: Buffer;
		if (compressionMethod === 0) {
			data = zipBuffer.subarray(dataStart, dataStart + uncompressedSize);
		} else if (compressionMethod === 8) {
			const compressed = zipBuffer.subarray(
				dataStart,
				dataStart + compressedSize,
			);
			data = inflateRawSync(compressed);
		} else {
			throw new Error(
				`Unsupported ZIP compression method: ${compressionMethod}`,
			);
		}

		entries.push({ name, data });

		offset += 46 + fileNameLength + extraFieldLength + commentLength;
	}

	return entries;
}
