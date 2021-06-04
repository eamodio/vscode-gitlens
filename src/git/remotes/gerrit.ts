'use strict';
import { Range, Uri } from 'vscode';
import { DynamicAutolinkReference } from '../../annotations/autolinks';
import { AutolinkReference } from '../../config';
import { GitRevision } from '../models/models';
import { Repository } from '../models/repository';
import { RemoteProvider } from './factory';

const fileRegex = /^\/([^/]+)\/\+(.+)$/i;
const rangeRegex = /^(\d+)$/;

export class GerritRemote extends RemoteProvider {
	constructor(domain: string, path: string, protocol?: string, name?: string, custom: boolean = false) {
		super(domain, path, protocol, name, custom);
	}

	private _autolinks: (AutolinkReference | DynamicAutolinkReference)[] | undefined;
	get autolinks(): (AutolinkReference | DynamicAutolinkReference)[] {
		if (this._autolinks === undefined) {
			this._autolinks = [
				{
					prefix: 'Change-Id: ',
					url: `${this.baseReviewUrl}/q/<num>`,
					title: `Open change #<num> on ${this.name}`,
					alphanumeric: true,
				},
			];
		}
		return this._autolinks;
	}

	get icon() {
		return 'gerrit';
	}

	get id() {
		return 'gerrit';
	}

	get name() {
		return this.formatName('Gerrit');
	}

	private get reviewDomain(): string {
		const [subdomain, secondLevelDomain, topLevelDomain] = this.domain.split('.');
		return [`${subdomain}-review`, secondLevelDomain, topLevelDomain].join('.');
	}

	private get baseReviewUrl(): string {
		return `${this.protocol}://${this.reviewDomain}`;
	}

	async getLocalInfoFromRemoteUri(
		repository: Repository,
		uri: Uri,
		options?: { validate?: boolean },
	): Promise<{ uri: Uri; startLine?: number } | undefined> {
		if (uri.authority !== this.domain) return undefined;
		if ((options?.validate ?? true) && !uri.path.startsWith(`/${this.path}/`)) return undefined;

		let startLine;
		if (uri.fragment) {
			const match = rangeRegex.exec(uri.fragment);
			if (match != null) {
				const [, start] = match;
				if (start) {
					startLine = parseInt(start, 10);
				}
			}
		}

		const match = fileRegex.exec(uri.path);
		if (match == null) return undefined;

		const [, , path] = match;

		// Check for a permalink
		let index = path.indexOf('/', 1);
		if (index !== -1) {
			const sha = path.substring(1, index);
			if (GitRevision.isSha(sha) || sha == 'HEAD') {
				const uri = repository.toAbsoluteUri(path.substr(index), { validate: options?.validate });
				if (uri != null) return { uri: uri, startLine: startLine };
			}
		}

		// Check for a link with branch (and deal with branch names with /)
		if (path.startsWith('/refs/heads/')) {
			const branches = new Set<string>(
				(
					await repository.getBranches({
						filter: b => b.remote,
					})
				).map(b => b.getNameWithoutRemote()),
			);
			const branchPath = path.substr('/refs/heads/'.length);

			do {
				index = branchPath.lastIndexOf('/', index - 1);
				const branch = branchPath.substring(0, index);

				if (branches.has(branch)) {
					const uri = repository.toAbsoluteUri(branchPath.substr(index), { validate: options?.validate });
					if (uri != null) return { uri: uri, startLine: startLine };
				}
			} while (index > 0);

			return undefined;
		}

		// Check for a link with tag (and deal with tag names with /)
		if (path.startsWith('/refs/tags/')) {
			const tags = new Set<string>((await repository.getTags()).map(t => t.name));
			const tagPath = path.substr('/refs/tags/'.length);

			do {
				index = tagPath.lastIndexOf('/', index - 1);
				const tag = tagPath.substring(0, index);

				if (tags.has(tag)) {
					const uri = repository.toAbsoluteUri(tagPath.substr(index), { validate: options?.validate });
					if (uri != null) return { uri: uri, startLine: startLine };
				}
			} while (index > 0);

			return undefined;
		}

		return undefined;
	}

	protected getUrlForBranches(): string {
		return this.encodeUrl(`${this.baseReviewUrl}/admin/repos/${this.path},branches`);
	}

	protected getUrlForBranch(branch: string): string {
		return this.encodeUrl(`${this.baseUrl}/+/refs/heads/${branch}`);
	}

	protected getUrlForCommit(sha: string): string {
		return this.encodeUrl(`${this.baseReviewUrl}/q/${sha}`);
	}

	protected getUrlForFile(fileName: string, branch?: string, sha?: string, range?: Range): string {
		const line = range != null ? `#${range.start.line}` : '';

		if (sha) return `${this.encodeUrl(`${this.baseUrl}/+/${sha}/${fileName}`)}${line}`;
		if (branch) return `${this.encodeUrl(`${this.getUrlForBranch(branch)}/${fileName}`)}${line}`;
		return `${this.encodeUrl(`${this.baseUrl}/+/HEAD/${fileName}`)}${line}`;
	}
}
