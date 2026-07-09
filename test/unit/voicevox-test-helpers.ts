import { deflateRawSync } from "node:zlib";

export function createZip(
	files: Array<{ name: string; data: Buffer; compression: 0 | 8 }>,
): Buffer {
	const localParts: Buffer[] = [];
	const centralParts: Buffer[] = [];
	let offset = 0;

	for (const { name, data, compression } of files) {
		const payload = compression === 8 ? deflateRawSync(data) : data;
		const nameBuf = Buffer.from(name, "utf8");
		const localHeader = Buffer.alloc(30 + nameBuf.length);
		localHeader.writeUInt32LE(0x04034b50, 0);
		localHeader.writeUInt16LE(20, 4);
		localHeader.writeUInt16LE(0, 6);
		localHeader.writeUInt16LE(compression, 8);
		localHeader.writeUInt16LE(0, 10);
		localHeader.writeUInt16LE(0, 12);
		localHeader.writeUInt32LE(0, 14);
		localHeader.writeUInt32LE(payload.length, 18);
		localHeader.writeUInt32LE(data.length, 22);
		localHeader.writeUInt16LE(nameBuf.length, 26);
		localHeader.writeUInt16LE(0, 28);
		nameBuf.copy(localHeader, 30);

		localParts.push(localHeader, payload);

		const centralHeader = Buffer.alloc(46 + nameBuf.length);
		centralHeader.writeUInt32LE(0x02014b50, 0);
		centralHeader.writeUInt16LE(20, 4);
		centralHeader.writeUInt16LE(20, 6);
		centralHeader.writeUInt16LE(0, 8);
		centralHeader.writeUInt16LE(compression, 10);
		centralHeader.writeUInt16LE(0, 12);
		centralHeader.writeUInt16LE(0, 14);
		centralHeader.writeUInt32LE(0, 16);
		centralHeader.writeUInt32LE(payload.length, 20);
		centralHeader.writeUInt32LE(data.length, 24);
		centralHeader.writeUInt16LE(nameBuf.length, 28);
		centralHeader.writeUInt16LE(0, 30);
		centralHeader.writeUInt16LE(0, 32);
		centralHeader.writeUInt16LE(0, 34);
		centralHeader.writeUInt32LE(offset, 42);
		nameBuf.copy(centralHeader, 46);
		centralParts.push(centralHeader);

		offset += localHeader.length + payload.length;
	}

	const centralDir = Buffer.concat(centralParts);
	const localData = Buffer.concat(localParts);
	const eocd = Buffer.alloc(22);
	eocd.writeUInt32LE(0x06054b50, 0);
	eocd.writeUInt16LE(0, 4);
	eocd.writeUInt16LE(0, 6);
	eocd.writeUInt16LE(files.length, 8);
	eocd.writeUInt16LE(files.length, 10);
	eocd.writeUInt32LE(centralDir.length, 12);
	eocd.writeUInt32LE(localData.length, 16);
	eocd.writeUInt16LE(0, 20);

	return Buffer.concat([localData, centralDir, eocd]);
}
