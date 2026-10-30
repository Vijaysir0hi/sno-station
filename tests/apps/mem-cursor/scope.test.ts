import { execFile } from "node:child_process";
import { realpathSync } from "node:fs";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { gitRoot, workspaceRoot } from "../../../apps/mem-cursor/src/scope.js";

const execFileAsync = promisify(execFile);

describe("gitRoot and workspaceRoot resolution", () => {
	let tempDirs: string[] = [];

	beforeEach(() => {
		tempDirs = [];
	});

	afterEach(async () => {
		await Promise.all(
			tempDirs.map((dir) => rm(dir, { recursive: true, force: true })),
		);
	});

	it("finds the git root from a subfolder of a fresh git init", async () => {
		const repo = await mkdtemp(join(tmpdir(), "mem-cursor-scope-repo-"));
		tempDirs.push(repo);
		await execFileAsync("git", ["init", "-q"], { cwd: repo });
		const subfolder = join(repo, "nested", "subfolder");
		await mkdir(subfolder, { recursive: true });

		const root = await gitRoot(subfolder);
		expect(root).toBe(realpathSync(repo));
	});

	it("returns null for a plain folder outside git", async () => {
		const plain = await mkdtemp(join(tmpdir(), "mem-cursor-scope-plain-"));
		tempDirs.push(plain);

		const root = await gitRoot(plain);
		expect(root).toBeNull();
	});

	it("falls back to the folder itself outside git", async () => {
		const plain = await mkdtemp(join(tmpdir(), "mem-cursor-scope-workspace-"));
		tempDirs.push(plain);

		const ws = await workspaceRoot(plain);
		expect(ws).toBe(resolve(plain));
	});

	it("resolves to git root when inside a work tree", async () => {
		const repo = await mkdtemp(join(tmpdir(), "mem-cursor-scope-ws-repo-"));
		tempDirs.push(repo);
		await execFileAsync("git", ["init", "-q"], { cwd: repo });
		const subfolder = join(repo, "apps", "sub");
		await mkdir(subfolder, { recursive: true });

		const ws = await workspaceRoot(subfolder);
		expect(ws).toBe(realpathSync(repo));
	});
});
