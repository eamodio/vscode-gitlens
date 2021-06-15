'use strict';
import { CustomRemoteType, RemotesConfig } from '../../configuration';
import { Logger } from '../../logger';
import { AzureDevOpsRemote } from './azure-devops';
import { BitbucketRemote } from './bitbucket';
import { BitbucketServerRemote } from './bitbucket-server';
import { CustomRemote } from './custom';
import { GerritRemote } from './gerrit';
import { GiteaRemote } from './gitea';
import { GitHubRemote } from './github';
import { GitLabRemote } from './gitlab';
import { RemoteProvider, RichRemoteProvider } from './provider';

export { RemoteProvider, RichRemoteProvider };
export type RemoteProviders = {
	custom: boolean;
	matcher: string | RegExp;
	creator: (domain: string, path: string) => RemoteProvider;
}[];

const builtInProviders: RemoteProviders = [
	{
		custom: false,
		matcher: 'bitbucket.org',
		creator: (domain: string, path: string) => new BitbucketRemote(domain, path),
	},
	{
		custom: false,
		matcher: 'github.com',
		creator: (domain: string, path: string) => new GitHubRemote(domain, path),
	},
	{
		custom: false,
		matcher: 'gitlab.com',
		creator: (domain: string, path: string) => new GitLabRemote(domain, path),
	},
	{
		custom: false,
		matcher: /\bdev\.azure\.com$/i,
		creator: (domain: string, path: string) => new AzureDevOpsRemote(domain, path),
	},
	{
		custom: true,
		matcher: /^(.+\/(?:bitbucket|stash))\/scm\/(.+)$/i,
		creator: (domain: string, path: string) => new BitbucketServerRemote(domain, path),
	},
	{
		custom: false,
		matcher: /\bgitlab\b/i,
		creator: (domain: string, path: string) => new GitLabRemote(domain, path),
	},
	{
		custom: false,
		matcher: /\bvisualstudio\.com$/i,
		creator: (domain: string, path: string) => new AzureDevOpsRemote(domain, path, undefined, undefined, true),
	},
	{
		custom: false,
		matcher: /\bgitea\b/i,
		creator: (domain: string, path: string) => new GiteaRemote(domain, path),
	},
	{
		custom: false,
		matcher: /\bgooglesource\.com$/i,
		creator: (domain: string, path: string) => new GerritRemote(domain, path),
	},
];

export class RemoteProviderFactory {
	static factory(providers: RemoteProviders): (domain: string, path: string) => RemoteProvider | undefined {
		return (domain: string, path: string) => this.create(providers, domain, path);
	}

	static create(providers: RemoteProviders, domain: string, path: string): RemoteProvider | undefined {
		try {
			const key = domain.toLowerCase();
			for (const { custom, matcher, creator } of providers) {
				if (typeof matcher === 'string') {
					if (matcher === key) return creator(domain, path);

					continue;
				}

				if (matcher.test(key)) return creator(domain, path);
				if (!custom) continue;

				const match = matcher.exec(`${domain}/${path}`);
				if (match != null) {
					return creator(match[1], match[2]);
				}
			}

			return undefined;
		} catch (ex) {
			Logger.error(ex, 'RemoteProviderFactory');
			return undefined;
		}
	}

	static loadProviders(cfg: RemotesConfig[] | null | undefined): RemoteProviders {
		const providers: RemoteProviders = [];

		if (cfg != null && cfg.length > 0) {
			for (const rc of cfg) {
				const provider = this.getCustomProvider(rc);
				if (provider == null) continue;

				let matcher: string | RegExp | undefined;
				try {
					matcher = rc.regex ? new RegExp(rc.regex, 'i') : rc.domain?.toLowerCase();
					if (matcher == null) throw new Error('No matcher found');
				} catch (ex) {
					Logger.error(ex, `Loading remote provider '${rc.name ?? ''}' failed`);
				}

				providers.push({
					custom: true,
					matcher: matcher!,
					creator: provider,
				});
			}
		}

		providers.push(...builtInProviders);

		return providers;
	}

	private static getCustomProvider(cfg: RemotesConfig) {
		switch (cfg.type) {
			case CustomRemoteType.Bitbucket:
				return (domain: string, path: string) =>
					new BitbucketRemote(domain, path, cfg.protocol, cfg.name, true);
			case CustomRemoteType.BitbucketServer:
				return (domain: string, path: string) =>
					new BitbucketServerRemote(domain, path, cfg.protocol, cfg.name, true);
			case CustomRemoteType.Custom:
				return (domain: string, path: string) =>
					new CustomRemote(domain, path, cfg.urls!, cfg.protocol, cfg.name);
			case CustomRemoteType.Gerrit:
				return (domain: string, path: string) => new GerritRemote(domain, path, cfg.protocol, cfg.name, true);
			case CustomRemoteType.Gitea:
				return (domain: string, path: string) => new GiteaRemote(domain, path, cfg.protocol, cfg.name, true);
			case CustomRemoteType.GitHub:
				return (domain: string, path: string) => new GitHubRemote(domain, path, cfg.protocol, cfg.name, true);
			case CustomRemoteType.GitLab:
				return (domain: string, path: string) => new GitLabRemote(domain, path, cfg.protocol, cfg.name, true);
			default:
				return undefined;
		}
	}
}
