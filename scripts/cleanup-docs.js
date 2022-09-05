// This is a script used to clean up the docs folder
import { readdir, readFile, writeFile } from "node:fs/promises";

async function loopDirectories(path = "./docs") {
	console.log(`Cleaning up folder ${path}`);
	const files = await readdir(path, { withFileTypes: true });
	for (const file of files) {
		if (file.isDirectory()) {
			await loopDirectories(`${path}/${file.name}`);
		} else {
			await modifyFile(`${path}/${file.name}`);
		}
	}
}

async function modifyFile(file) {
	const fileContents = await readFile(file, { encoding: "utf-8" });
	const newFileContents = fileContents.replace(/\.html/g, "");
	if (fileContents !== newFileContents) {
		console.log(`Editing ${file}`);
		await writeFile(file, newFileContents);
	}
}

console.log("✨ Starting Cleanup...\n");
loopDirectories().then(() => {
	console.log("\n✨ Finished Cleanup!");
});
