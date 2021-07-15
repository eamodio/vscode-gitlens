'use strict';
import * as fs from 'fs';
import * as paths from 'path';
import { Uri } from 'vscode';
import { UriComparer } from '../comparers';
import { DocumentSchemes } from '../constants';
import { Container } from '../container';
import { GitCommit, GitFile, GitRevision } from '../git/git';
import { Logger } from '../logger';
import { debug, memoize, Strings } from '../system';

const emptyStr = '';
const slash = '/';

export interface GitCommitish {
	fileName?: string;
	repoPath: string;
	sha?: string;
	versionedPath?: string;
}

interface UriComponents {
	scheme: string;
	authority: string;
	path: string;
	query: string;
	fragment: string;
}

interface UriEx {
	new (): Uri;
	new (scheme: string, authority: string, path: string, query: string, fragment: string): Uri;
	// Use this ctor, because vscode doesn't validate it
	new (components: UriComponents): Uri;
}

export class GitUri extends (Uri as any as UriEx) {
	static is(uri: any): uri is GitUri {
		return uri instanceof GitUri;
	}

	readonly repoPath?: string;
	readonly sha?: string;
	readonly versionedPath?: string;

	constructor(uri?: Uri);
	constructor(uri: Uri, commit: GitCommitish);
	constructor(uri: Uri, repoPath: string | undefined);
	constructor(uri?: Uri, commitOrRepoPath?: GitCommitish | string) {
		if (uri == null) {
			super('unknown', emptyStr, emptyStr, emptyStr, emptyStr);

			return;
		}

		if (uri.scheme === DocumentSchemes.GitLens) {
			const data = JSON.parse(uri.query) as UriRevisionData;

			// Fixes issues with uri.query:
			// When Uri's come from the FileSystemProvider, the uri.query only contains the root repo info (not the actual file path)
			// When Uri's come from breadcrumbs (via the FileSystemProvider), the uri.query contains the wrong file path
			if (data.path !== uri.path) {
				if (data.path.startsWith('//') && !uri.path.startsWith('//')) {
					data.path = `/${uri.path}`;
				} else {
					data.path = uri.path;
				}
			}

			super({
				scheme: uri.scheme,
				authority: uri.authority,
				path: data.path,
				query: JSON.stringify(data),
				fragment: uri.fragment,
			});

			this.repoPath = data.repoPath;
			if (GitRevision.isUncommittedStaged(data.ref) || !GitRevision.isUncommitted(data.ref)) {
				this.sha = data.ref;
			}

			return;
		}

		if (commitOrRepoPath === undefined) {
			super(uri);

			return;
		}

		if (typeof commitOrRepoPath === 'string') {
			super(uri);

			this.repoPath = commitOrRepoPath;

			return;
		}

		const [authority, fsPath] = GitUri.ensureValidUNCPath(
			uri.authority,
			GitUri.resolve(commitOrRepoPath.fileName ?? uri.fsPath, commitOrRepoPath.repoPath),
		);

		let path;
		switch (uri.scheme) {
			case 'https':
			case 'http':
			case 'file':
				if (!fsPath) {
					path = slash;
				} else if (!fsPath.startsWith(slash)) {
					path = `/${fsPath}`;
				} else {
					path = fsPath;
				}
				break;
			default:
				path = fsPath;
				break;
		}

		super({
			scheme: uri.scheme,
			authority: authority,
			path: path,
			query: uri.query,
			fragment: uri.fragment,
		});
		this.repoPath = commitOrRepoPath.repoPath;
		this.versionedPath = commitOrRepoPath.versionedPath;
		if (GitRevision.isUncommittedStaged(commitOrRepoPath.sha) || !GitRevision.isUncommitted(commitOrRepoPath.sha)) {
			this.sha = commitOrRepoPath.sha;
		}
	}

	@memoize()
	get directory(): string {
		return GitUri.getDirectory(this.relativeFsPath);
	}

	@memoize()
	get fileName(): string {
		return paths.basename(this.relativeFsPath);
	}

	@memoize()
	get isUncommitted() {
		return GitRevision.isUncommitted(this.sha);
	}

	@memoize()
	get isUncommittedStaged() {
		return GitRevision.isUncommittedStaged(this.sha);
	}

	@memoize()
	private get relativeFsPath() {
		return this.repoPath == null || this.repoPath.length === 0
			? this.fsPath
			: paths.relative(this.repoPath, this.fsPath);
	}

	@memoize()
	get relativePath() {
		return Strings.normalizePath(this.relativeFsPath);
	}

	@memoize()
	get shortSha() {
		return GitRevision.shorten(this.sha);
	}

	@memoize<GitUri['documentUri']>(options => `${options?.useVersionedPath ? 'versioned' : ''}`)
	documentUri({ useVersionedPath }: { useVersionedPath?: boolean } = {}) {
		if (useVersionedPath && this.versionedPath !== undefined) return GitUri.file(this.versionedPath);
		if (this.scheme !== 'file') return this;

		return GitUri.file(this.fsPath);
	}

	equals(uri: Uri | undefined) {
		if (!UriComparer.equals(this, uri)) return false;

		return this.sha === (GitUri.is(uri) ? uri.sha : undefined);
	}

	getFormattedFilename(options: { suffix?: string; truncateTo?: number } = {}): string {
		return GitUri.getFormattedFilename(this.fsPath, options);
	}

	getFormattedPath(options: { relativeTo?: string; suffix?: string; truncateTo?: number } = {}): string {
		return GitUri.getFormattedPath(this.fsPath, { relativeTo: this.repoPath, ...options });
	}

	@memoize()
	toFileUri() {
		return GitUri.file(this.fsPath);
	}

	private static ensureValidUNCPath(authority: string, fsPath: string): [string, string] {
		// Check for authority as used in UNC shares or use the path as given
		if (fsPath[0] === slash && fsPath[1] === slash) {
			const index = fsPath.indexOf(slash, 2);
			if (index === -1) {
				authority = fsPath.substring(2);
				fsPath = slash;
			} else {
				authority = fsPath.substring(2, index);
				fsPath = fsPath.substring(index) || slash;
			}
		}

		return [authority, fsPath];
	}

	static file(path: string, useVslsScheme?: boolean) {
		const uri = Uri.file(path);
		if (Container.vsls.isMaybeGuest && useVslsScheme !== false) {
			return uri.with({ scheme: DocumentSchemes.Vsls });
		}

		return uri;
	}

	static fromCommit(commit: GitCommit, previous: boolean = false) {
		if (!previous) return new GitUri(commit.uri, commit);

		return new GitUri(commit.previousUri, {
			repoPath: commit.repoPath,
			sha: commit.previousSha,
		});
	}

	static fromFile(file: string | GitFile, repoPath: string, ref?: string, original: boolean = false): GitUri {
		const uri = GitUri.resolveToUri(
			typeof file === 'string' ? file : (original && file.originalFileName) || file.fileName,
			repoPath,
		);
		return ref == null || ref.length === 0
			? new GitUri(uri, repoPath)
			: new GitUri(uri, { repoPath: repoPath, sha: ref });
	}

	static fromRepoPath(repoPath: string, ref?: string) {
		return ref == null || ref.length === 0
			? new GitUri(GitUri.file(repoPath), repoPath)
			: new GitUri(GitUri.file(repoPath), { repoPath: repoPath, sha: ref });
	}

	static fromRevisionUri(uri: Uri): GitUri {
		return new GitUri(uri);
	}

	@debug({
		exit: uri => `returned ${Logger.toLoggable(uri)}`,
	})
	static async fromUri(uri: Uri): Promise<GitUri> {
		if (GitUri.is(uri)) return uri;

		const uriPath = uri.fsPath;
		const realPath = fs.realpathSync(uriPath);
		if (uriPath !== realPath) {
			// If we got here, it means the original URI is to a symbolic link, so we create a new one using the real location.
			const newUri = Uri.file(realPath);

			return this.fromUri(newUri);
		}

		if (!Container.git.isTrackable(uri)) return new GitUri(uri);

		if (uri.scheme === DocumentSchemes.GitLens) return new GitUri(uri);

		// If this is a git uri, find its repoPath
		if (uri.scheme === DocumentSchemes.Git) {
			try {
				const data: { path: string; ref: string } = JSON.parse(uri.query);

				const repoPath = await Container.git.getRepoPath(data.path);

				let ref;
				switch (data.ref) {
					case emptyStr:
					case '~':
						ref = GitRevision.uncommittedStaged;
						break;

					case null:
						ref = undefined;
						break;

					default:
						ref = data.ref;
						break;
				}

				const commitish: GitCommitish = {
					fileName: data.path,
					repoPath: repoPath!,
					sha: ref,
				};
				return new GitUri(uri, commitish);
			} catch {}
		}

		if (uri.scheme === DocumentSchemes.PRs) {
			try {
				const data: {
					baseCommit: string;
					headCommit: string;
					isBase: boolean;
					fileName: string;
					prNumber: number;
					status: number;
					remoteName: string;
				} = JSON.parse(uri.query);

				let repoPath = Strings.normalizePath(uri.fsPath);
				if (repoPath.endsWith(data.fileName)) {
					repoPath = repoPath.substr(0, repoPath.length - data.fileName.length - 1);
				} else {
					repoPath = (await Container.git.getRepoPath(uri.fsPath))!;
				}

				const commitish: GitCommitish = {
					fileName: data.fileName,
					repoPath: repoPath,
					sha: data.isBase ? data.baseCommit : data.headCommit,
				};
				return new GitUri(uri, commitish);
			} catch {}
		}

		return new GitUri(uri, await Container.git.getRepoPath(uri));
	}

	static getDirectory(fileName: string, relativeTo?: string): string {
		let directory: string | undefined = paths.dirname(fileName);
		directory = relativeTo != null ? GitUri.relativeTo(directory, relativeTo) : Strings.normalizePath(directory);
		return directory == null || directory.length === 0 || directory === '.' ? emptyStr : directory;
	}

	static getFormattedFilename(
		fileNameOrUri: string | Uri,
		options: {
			suffix?: string;
			truncateTo?: number;
		} = {},
	): string {
		const { suffix = emptyStr, truncateTo } = options;

		let fileName: string;
		if (fileNameOrUri instanceof Uri) {
			fileName = fileNameOrUri.fsPath;
		} else {
			fileName = fileNameOrUri;
		}

		let file = paths.basename(fileName);
		if (truncateTo != null && file.length >= truncateTo) {
			return Strings.truncateMiddle(file, truncateTo);
		}

		if (suffix) {
			if (truncateTo != null && file.length + suffix.length >= truncateTo) {
				return `${Strings.truncateMiddle(file, truncateTo - suffix.length)}${suffix}`;
			}

			file += suffix;
		}

		return file;
	}

	static getFormattedPath(
		fileNameOrUri: string | Uri,
		options: {
			relativeTo?: string;
			suffix?: string;
			truncateTo?: number;
		},
	): string {
		const { relativeTo, suffix = emptyStr, truncateTo } = options;

		let fileName: string;
		if (fileNameOrUri instanceof Uri) {
			fileName = fileNameOrUri.fsPath;
		} else {
			fileName = fileNameOrUri;
		}

		let file = paths.basename(fileName);
		if (truncateTo != null && file.length >= truncateTo) {
			return Strings.truncateMiddle(file, truncateTo);
		}

		if (suffix) {
			if (truncateTo != null && file.length + suffix.length >= truncateTo) {
				return `${Strings.truncateMiddle(file, truncateTo - suffix.length)}${suffix}`;
			}

			file += suffix;
		}

		const directory = GitUri.getDirectory(fileName, relativeTo);
		if (!directory) return file;

		file = `/${file}`;

		if (truncateTo != null && file.length + directory.length >= truncateTo) {
			return `${Strings.truncateLeft(directory, truncateTo - file.length)}${file}`;
		}

		return `${directory}${file}`;
	}

	static relativeTo(fileNameOrUri: string | Uri, relativeTo: string | undefined): string {
		const fileName = fileNameOrUri instanceof Uri ? fileNameOrUri.fsPath : fileNameOrUri;
		const relativePath =
			relativeTo == null || relativeTo.length === 0 || !paths.isAbsolute(fileName)
				? fileName
				: paths.relative(relativeTo, fileName);
		return Strings.normalizePath(relativePath);
	}

	static git(fileName: string, repoPath?: string) {
		const path = GitUri.resolve(fileName, repoPath);
		return Uri.parse(
			// Change encoded / back to / otherwise uri parsing won't work properly
			`${DocumentSchemes.Git}:/${encodeURIComponent(path).replace(/%2F/g, slash)}?${encodeURIComponent(
				JSON.stringify({
					// Ensure we use the fsPath here, otherwise the url won't open properly
					path: Uri.file(path).fsPath,
					ref: '~',
				}),
			)}`,
		);
	}

	static resolve(fileName: string, repoPath?: string) {
		const normalizedFileName = Strings.normalizePath(fileName);
		if (repoPath === undefined) return normalizedFileName;

		const normalizedRepoPath = Strings.normalizePath(repoPath);
		if (normalizedFileName == null || normalizedFileName.length === 0) return normalizedRepoPath;

		if (normalizedFileName.startsWith(normalizedRepoPath)) return normalizedFileName;

		return Strings.normalizePath(paths.join(normalizedRepoPath, normalizedFileName));
	}

	static resolveToUri(fileName: string, repoPath?: string) {
		return GitUri.file(this.resolve(fileName, repoPath));
	}

	static toKey(fileName: string): string;
	static toKey(uri: Uri): string;
	static toKey(fileNameOrUri: string | Uri): string;
	static toKey(fileNameOrUri: string | Uri): string {
		return Strings.normalizePath(typeof fileNameOrUri === 'string' ? fileNameOrUri : fileNameOrUri.fsPath);

		// return typeof fileNameOrUri === 'string'
		//     ? GitUri.file(fileNameOrUri).toString(true)
		//     : fileNameOrUri.toString(true);
	}

	static toRevisionUri(uri: GitUri): Uri;
	static toRevisionUri(ref: string, fileName: string, repoPath: string): Uri;
	static toRevisionUri(ref: string, file: GitFile, repoPath: string): Uri;
	static toRevisionUri(uriOrRef: string | GitUri, fileNameOrFile?: string | GitFile, repoPath?: string): Uri {
		let fileName: string;
		let ref: string | undefined;
		let shortSha: string | undefined;

		if (typeof uriOrRef === 'string') {
			if (typeof fileNameOrFile === 'string') {
				fileName = fileNameOrFile;
			} else {
				//if (fileNameOrFile!.status === 'D') {
				fileName = GitUri.resolve(fileNameOrFile!.originalFileName ?? fileNameOrFile!.fileName, repoPath);
				// } else {
				// 	fileName = GitUri.resolve(fileNameOrFile!.fileName, repoPath);
			}

			ref = uriOrRef;
			shortSha = GitRevision.shorten(ref);
		} else {
			fileName = uriOrRef.fsPath;

			ref = uriOrRef.sha;
			shortSha = uriOrRef.shortSha;
			repoPath = uriOrRef.repoPath!;
		}

		if (ref == null || ref.length === 0) {
			return Uri.file(fileName);
		}

		if (GitRevision.isUncommitted(ref)) {
			return GitRevision.isUncommittedStaged(ref) ? GitUri.git(fileName, repoPath) : Uri.file(fileName);
		}

		const filePath = Strings.normalizePath(fileName, { addLeadingSlash: true });
		const data: UriRevisionData = {
			path: filePath,
			ref: ref,
			repoPath: Strings.normalizePath(repoPath!),
		};

		const uri = Uri.parse(
			// Replace / in the authority with a similar unicode characters otherwise parsing will be wrong
			`${DocumentSchemes.GitLens}://${encodeURIComponent(shortSha.replace(/\//g, '\u200A\u2215\u200A'))}${
				// Change encoded / back to / otherwise uri parsing won't work properly
				filePath === slash ? emptyStr : encodeURIComponent(filePath).replace(/%2F/g, slash)
			}?${encodeURIComponent(JSON.stringify(data))}`,
		);
		return uri;
	}
}

interface UriRevisionData {
	path: string;
	ref?: string;
	repoPath: string;
}
