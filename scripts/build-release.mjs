import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const rootDir = resolve(dirname(new URL(import.meta.url).pathname), "..");
const distDir = join(rootDir, "dist");

const packageJson = JSON.parse(readFileSync(join(rootDir, "package.json"), "utf8"));
const manifest = JSON.parse(readFileSync(join(rootDir, "manifest.json"), "utf8"));
const versions = JSON.parse(readFileSync(join(rootDir, "versions.json"), "utf8"));

if (packageJson.version !== manifest.version) {
  throw new Error(`Version mismatch: package.json=${packageJson.version}, manifest.json=${manifest.version}`);
}

if (!versions[manifest.version]) {
  throw new Error(`versions.json is missing an entry for ${manifest.version}`);
}

const releaseName = `${manifest.id}-${manifest.version}`;
const releaseDir = join(distDir, releaseName);
const zipPath = join(distDir, `${releaseName}.zip`);

rmSync(releaseDir, { recursive: true, force: true });
rmSync(zipPath, { force: true });
mkdirSync(releaseDir, { recursive: true });

const artifacts = [
  "main.js",
  "manifest.json",
  "styles.css",
  "README.md",
  "LICENSE",
  "CHANGELOG.md"
];

for (const artifact of artifacts) {
  const source = join(rootDir, artifact);
  if (!existsSync(source)) {
    throw new Error(`Missing release artifact: ${artifact}`);
  }
  cpSync(source, join(releaseDir, artifact));
}

const buildInfo = {
  pluginId: manifest.id,
  version: manifest.version,
  minAppVersion: manifest.minAppVersion,
  packagedAt: new Date().toISOString(),
  artifacts
};

writeFileSync(join(releaseDir, "release-info.json"), JSON.stringify(buildInfo, null, 2) + "\n");

execFileSync("zip", ["-rq", zipPath, releaseName], {
  cwd: distDir,
  stdio: "inherit"
});

process.stdout.write(`Packaged release:\n- ${releaseDir}\n- ${zipPath}\n`);
