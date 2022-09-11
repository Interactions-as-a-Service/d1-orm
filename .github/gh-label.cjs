const { execSync } = require("child_process");

const res = execSync("gh pr status --json title -q .currentBranch.title")
	.toString()
	.trim();
const title = "Version Packages";

if (res === title) {
	console.log("Adding label 'version-packages'");
	execSync('gh pr edit --add-label "Version Packages"');
} else {
	console.log("No version packages PR");
}
