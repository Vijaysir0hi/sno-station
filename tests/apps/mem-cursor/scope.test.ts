import { execFile } from "node:child_process";
import { realpathSync } from "node:fs";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { gitRoot, workspaceRoot } from "../../../apps/mem-cursor/src/scope.js";

const execFileAsync = promisify(execFile);

describe("mem-cursor scope", () => {
	let tempDir: string;
	let previousHome: string | undefined;

	beforeEach(async () => {
		tempDir = await mkdtemp(join(tmpdir(), "mem-cursor-scope-"));
		previousHome = process.env.HOME;
		process.env.HOME = tempDir;
	});

	afterEach(async () => {
		if (previousHome !== undefined) process.env.HOME = previousHome;
		await rm(tempDir, { recursive: true, force: true });
	});

	it("gitRoot finds the root from a subfolder of a fresh git init", async () => {
		const repoDir = join(tempDir, "repo");
		await mkdir(repoDir, { recursive: true });
		await execFileAsync("git", ["init", repoDir], { env: { ...process.env, HOME: tempDir } });
		const subDir = join(repoDir, "nested", "deep");
		await mkdir(subDir, { recursive: true });

		const root = await gitRoot(subDir);
		expect(root).toBe(realpathSync(repoDir));
	});

	it("gitRoot returns null for a plain folder outside git", async () => {
		const plainDir = join(tempDir, "plain");
		await mkdir(plainDir, { recursive: true });

		expect(await gitRoot(plainDir)).toBeNull();
	});

	it("workspaceRoot returns the folder itself outside git", async () => {
		const plainDir = join(tempDir, "plain");
		await mkdir(plainDir, { recursive: true });

		expect(await workspaceRoot(plainDir)).toBe(resolve(plainDir));
	});
});
