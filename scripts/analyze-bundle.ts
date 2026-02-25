#!/usr/bin/env node

/**
 * Bundle size analyzer
 * Displays the size of all files in the dist directory
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface FileStat {
	file: string;
	size: string;
	bytes: number;
}

const distDir = join(__dirname, "..", "dist");

if (!existsSync(distDir)) {
	console.error("❌ dist directory not found. Run `npm run build` first.");
	process.exit(1);
}

const files = readdirSync(distDir);
const fileStats: FileStat[] = files.map((file) => {
	const filePath = join(distDir, file);
	const stats = statSync(filePath);
	const sizeKB = (stats.size / 1024).toFixed(2);
	const sizeMB = (stats.size / (1024 * 1024)).toFixed(4);

	return {
		file,
		size: Number(sizeKB) < 1000 ? `${sizeKB} KB` : `${sizeMB} MB`,
		bytes: stats.size,
	};
});

// Sort by size descending
fileStats.sort((a, b) => b.bytes - a.bytes);

// Calculate total
const totalBytes = fileStats.reduce((sum, stat) => sum + stat.bytes, 0);
const totalKB = (totalBytes / 1024).toFixed(2);
const totalMB = (totalBytes / (1024 * 1024)).toFixed(4);

console.log("\n📦 Bundle Size Analysis\n");
console.log("┌─────────────────────────────────────────┬──────────────┐");
console.log("│ File                                    │ Size         │");
console.log("├─────────────────────────────────────────┼──────────────┤");

fileStats.forEach((stat) => {
	const fileName = stat.file.padEnd(39);
	const size = stat.size.padStart(12);
	console.log(`│ ${fileName} │ ${size} │`);
});

console.log("├─────────────────────────────────────────┼──────────────┤");
const totalSize = Number(totalKB) < 1000 ? `${totalKB} KB` : `${totalMB} MB`;
console.log(`│ ${"Total".padEnd(39)} │ ${totalSize.padStart(12)} │`);
console.log("└─────────────────────────────────────────┴──────────────┘\n");
