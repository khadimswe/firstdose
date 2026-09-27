// Rebuild the composition, then carve the music bed around the voices.
// Needs: python (build.py) and the hyperframes-audio skill (`npx hyperframes skills update general-video`).
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

execFileSync("python", ["build.py"], { stdio: "inherit" });
const carve = [join(homedir(), ".claude/skills/hyperframes-audio/scripts/carve.mjs"),
               join(homedir(), ".agents/skills/hyperframes-audio/scripts/carve.mjs")].find(existsSync);
if (!carve) throw new Error("hyperframes-audio skill not found: run `npx hyperframes skills update general-video`");
execFileSync("node", [carve, "--comp", "index.html", "--bed", "a-bgm", "--strength", "0.85"], { stdio: "inherit" });
