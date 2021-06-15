'use strict';

export enum TraceLevel {
	Silent = 'silent',
	Errors = 'errors',
	Verbose = 'verbose',
	Debug = 'debug',
}

export interface Config {
	autolinks: AutolinkReference[] | null;
	blame: {
		avatars: boolean;
		compact: boolean;
		dateFormat: string | null;
		format: string;
		heatmap: {
			enabled: boolean;
			location: 'left' | 'right';
		};
		highlight: {
			enabled: boolean;
			locations: BlameHighlightLocations[];
		};
		ignoreWhitespace: boolean;
		separateLines: boolean;
		toggleMode: AnnotationsToggleMode;
	};
	changes: {
		locations: ChangesLocations[];
		toggleMode: AnnotationsToggleMode;
	};
	codeLens: CodeLensConfig;
	currentLine: {
		dateFormat: string | null;
		enabled: boolean;
		format: string;
		pullRequests: {
			enabled: boolean;
		};
		scrollable: boolean;
	};
	debug: boolean;
	defaultDateFormat: string | null;
	defaultDateShortFormat: string | null;
	defaultDateSource: DateSource;
	defaultDateStyle: DateStyle;
	defaultGravatarsStyle: GravatarDefaultStyle;
	defaultTimeFormat: string | null;
	fileAnnotations: {
		command: string | null;
	};
	gitCommands: {
		closeOnFocusOut: boolean;
		search: {
			matchAll: boolean;
			matchCase: boolean;
			matchRegex: boolean;
			showResultsInSideBar: boolean | null;
		};
		skipConfirmations: string[];
		sortBy: GitCommandSorting;
	};
	heatmap: {
		ageThreshold: number;
		coldColor: string;
		hotColor: string;
		locations: HeatmapLocations[];
		toggleMode: AnnotationsToggleMode;
	};
	hovers: {
		annotations: {
			changes: boolean;
			details: boolean;
			enabled: boolean;
			over: 'line' | 'annotation';
		};
		autolinks: {
			enabled: boolean;
			enhanced: boolean;
		};
		currentLine: {
			changes: boolean;
			details: boolean;
			enabled: boolean;
			over: 'line' | 'annotation';
		};
		avatars: boolean;
		avatarSize: number;
		changesDiff: 'line' | 'hunk';
		detailsMarkdownFormat: string;
		enabled: boolean;
		pullRequests: {
			enabled: boolean;
		};
	};
	integrations: {
		enabled: boolean;
	};
	keymap: KeyMap;
	liveshare: {
		allowGuestAccess: boolean;
	};
	menus: boolean | MenuConfig;
	mode: {
		active: string;
		statusBar: {
			enabled: boolean;
			alignment: 'left' | 'right';
		};
	};
	modes: Record<string, ModeConfig> | null;
	outputLevel: TraceLevel;
	partners: Record<
		string,
		{
			enabled: boolean;
			[key: string]: any;
		}
	> | null;
	remotes: RemotesConfig[] | null;
	showWelcomeOnInstall: boolean;
	showWhatsNewAfterUpgrades: boolean;
	sortBranchesBy: BranchSorting;
	sortContributorsBy: ContributorSorting;
	sortTagsBy: TagSorting;
	statusBar: {
		alignment: 'left' | 'right';
		command: StatusBarCommand;
		dateFormat: string | null;
		enabled: boolean;
		format: string;
		reduceFlicker: boolean;
		pullRequests: {
			enabled: boolean;
		};
	};
	strings: {
		codeLens: {
			unsavedChanges: {
				recentChangeAndAuthors: string;
				recentChangeOnly: string;
				authorsOnly: string;
			};
		};
	};
	terminalLinks: {
		enabled: boolean;
	};
	views: ViewsConfig;
	advanced: AdvancedConfig;
}

export enum AnnotationsToggleMode {
	File = 'file',
	Window = 'window',
}

export interface AutolinkReference {
	prefix: string;
	url: string;
	title?: string;
	alphanumeric?: boolean;
	ignoreCase?: boolean;
}

export enum BlameHighlightLocations {
	Gutter = 'gutter',
	Line = 'line',
	Overview = 'overview',
}

export enum BranchSorting {
	DateDesc = 'date:desc',
	DateAsc = 'date:asc',
	NameAsc = 'name:asc',
	NameDesc = 'name:desc',
}

export enum ChangesLocations {
	Gutter = 'gutter',
	Overview = 'overview',
}

export enum CodeLensCommand {
	CopyRemoteCommitUrl = 'gitlens.copyRemoteCommitUrl',
	CopyRemoteFileUrl = 'gitlens.copyRemoteFileUrl',
	DiffWithPrevious = 'gitlens.diffWithPrevious',
	OpenCommitOnRemote = 'gitlens.openCommitOnRemote',
	OpenFileOnRemote = 'gitlens.openFileOnRemote',
	RevealCommitInView = 'gitlens.revealCommitInView',
	ShowCommitsInView = 'gitlens.showCommitsInView',
	ShowQuickCommitDetails = 'gitlens.showQuickCommitDetails',
	ShowQuickCommitFileDetails = 'gitlens.showQuickCommitFileDetails',
	ShowQuickCurrentBranchHistory = 'gitlens.showQuickRepoHistory',
	ShowQuickFileHistory = 'gitlens.showQuickFileHistory',
	ToggleFileBlame = 'gitlens.toggleFileBlame',
	ToggleFileChanges = 'gitlens.toggleFileChanges',
	ToggleFileChangesOnly = 'gitlens.toggleFileChangesOnly',
	ToggleFileHeatmap = 'gitlens.toggleFileHeatmap',
}

export enum CodeLensScopes {
	Document = 'document',
	Containers = 'containers',
	Blocks = 'blocks',
}

export enum ContributorSorting {
	CountDesc = 'count:desc',
	CountAsc = 'count:asc',
	DateDesc = 'date:desc',
	DateAsc = 'date:asc',
	NameAsc = 'name:asc',
	NameDesc = 'name:desc',
}

export enum CustomRemoteType {
	Bitbucket = 'Bitbucket',
	BitbucketServer = 'BitbucketServer',
	Custom = 'Custom',
	Gerrit = 'Gerrit',
	Gitea = 'Gitea',
	GitHub = 'GitHub',
	GitLab = 'GitLab',
}

export enum DateSource {
	Authored = 'authored',
	Committed = 'committed',
}

export enum DateStyle {
	Absolute = 'absolute',
	Relative = 'relative',
}

export enum FileAnnotationType {
	Blame = 'blame',
	Changes = 'changes',
	Heatmap = 'heatmap',
}

export enum GitCommandSorting {
	Name = 'name',
	Usage = 'usage',
}

export enum GravatarDefaultStyle {
	Faces = 'wavatar',
	Geometric = 'identicon',
	Monster = 'monsterid',
	MysteryPerson = 'mp',
	Retro = 'retro',
	Robot = 'robohash',
}

export enum HeatmapLocations {
	Gutter = 'gutter',
	Overview = 'overview',
}

export enum KeyMap {
	Alternate = 'alternate',
	Chorded = 'chorded',
	None = 'none',
}

export enum StatusBarCommand {
	CopyRemoteCommitUrl = 'gitlens.copyRemoteCommitUrl',
	CopyRemoteFileUrl = 'gitlens.copyRemoteFileUrl',
	DiffWithPrevious = 'gitlens.diffWithPrevious',
	DiffWithWorking = 'gitlens.diffWithWorking',
	OpenCommitOnRemote = 'gitlens.openCommitOnRemote',
	OpenFileOnRemote = 'gitlens.openFileOnRemote',
	RevealCommitInView = 'gitlens.revealCommitInView',
	ShowCommitsInView = 'gitlens.showCommitsInView',
	ShowQuickCommitDetails = 'gitlens.showQuickCommitDetails',
	ShowQuickCommitFileDetails = 'gitlens.showQuickCommitFileDetails',
	ShowQuickCurrentBranchHistory = 'gitlens.showQuickRepoHistory',
	ShowQuickFileHistory = 'gitlens.showQuickFileHistory',
	ToggleCodeLens = 'gitlens.toggleCodeLens',
	ToggleFileBlame = 'gitlens.toggleFileBlame',
	ToggleFileChanges = 'gitlens.toggleFileChanges',
	ToggleFileChangesOnly = 'gitlens.toggleFileChangesOnly',
	ToggleFileHeatmap = 'gitlens.toggleFileHeatmap',
}

export enum TagSorting {
	DateDesc = 'date:desc',
	DateAsc = 'date:asc',
	NameAsc = 'name:asc',
	NameDesc = 'name:desc',
}

export enum ViewBranchesLayout {
	List = 'list',
	Tree = 'tree',
}

export enum ViewFilesLayout {
	Auto = 'auto',
	List = 'list',
	Tree = 'tree',
}

export enum ViewShowBranchComparison {
	Branch = 'branch',
	Working = 'working',
}

export interface AdvancedConfig {
	abbreviatedShaLength: number;
	abbreviateShaOnCopy: boolean;
	blame: {
		customArguments: string[] | null;
		delayAfterEdit: number;
		sizeThresholdAfterEdit: number;
	};
	caching: {
		enabled: boolean;
	};
	commitOrdering: string | null;
	externalDiffTool: string | null;
	externalDirectoryDiffTool: string | null;
	fileHistoryFollowsRenames: boolean;
	fileHistoryShowAllBranches: boolean;
	maxListItems: number;
	maxSearchItems: number;
	messages: {
		suppressCommitHasNoPreviousCommitWarning: boolean;
		suppressCommitNotFoundWarning: boolean;
		suppressCreatePullRequestPrompt: boolean;
		suppressDebugLoggingWarning: boolean;
		suppressFileNotUnderSourceControlWarning: boolean;
		suppressGitDisabledWarning: boolean;
		suppressGitMissingWarning: boolean;
		suppressGitVersionWarning: boolean;
		suppressImproperWorkspaceCasingWarning: boolean;
		suppressLineUncommittedWarning: boolean;
		suppressNoRepositoryWarning: boolean;
		suppressRebaseSwitchToTextWarning: boolean;
	};
	quickPick: {
		closeOnFocusOut: boolean;
	};
	repositorySearchDepth: number;
	similarityThreshold: number | null;
}

export interface CodeLensConfig {
	authors: {
		enabled: boolean;
		command: CodeLensCommand | false;
	};
	enabled: boolean;
	includeSingleLineSymbols: boolean;
	recentChange: {
		enabled: boolean;
		command: CodeLensCommand | false;
	};
	scopes: CodeLensScopes[];
	scopesByLanguage: CodeLensLanguageScope[] | null;
	symbolScopes: string[];
}

export interface CodeLensLanguageScope {
	language: string | undefined;
	scopes?: CodeLensScopes[];
	symbolScopes?: string[];
}

export interface MenuConfig {
	editor:
		| false
		| {
				blame: boolean;
				clipboard: boolean;
				compare: boolean;
				history: boolean;
				remote: boolean;
		  };
	editorGroup:
		| false
		| {
				blame: boolean;
				compare: boolean;
		  };
	editorTab:
		| false
		| {
				clipboard: boolean;
				compare: boolean;
				history: boolean;
				remote: boolean;
		  };
	explorer:
		| false
		| {
				clipboard: boolean;
				compare: boolean;
				history: boolean;
				remote: boolean;
		  };
	scm:
		| false
		| {
				authors: boolean;
		  };
	scmGroupInline:
		| false
		| {
				stash: boolean;
		  };
	scmGroup:
		| false
		| {
				compare: boolean;
				openClose: boolean;
				stash: boolean;
		  };
	scmItem:
		| false
		| {
				clipboard: boolean;
				compare: boolean;
				history: boolean;
				remote: boolean;
				stash: boolean;
		  };
}

export interface ModeConfig {
	name: string;
	statusBarItemName?: string;
	description?: string;
	annotations?: 'blame' | 'changes' | 'heatmap';
	codeLens?: boolean;
	currentLine?: boolean;
	hovers?: boolean;
	statusBar?: boolean;
}

export type RemotesConfig =
	| {
			domain: string;
			regex: null;
			name?: string;
			protocol?: string;
			type: CustomRemoteType;
			urls?: RemotesUrlsConfig;
	  }
	| {
			domain: null;
			regex: string;
			name?: string;
			protocol?: string;
			type: CustomRemoteType;
			urls?: RemotesUrlsConfig;
	  };

export interface RemotesUrlsConfig {
	repository: string;
	branches: string;
	branch: string;
	commit: string;
	comparison?: string;
	file: string;
	fileInBranch: string;
	fileInCommit: string;
	fileLine: string;
	fileRange: string;
}

export interface ViewsCommonConfig {
	defaultItemLimit: number;
	formats: {
		commits: {
			label: string;
			description: string;
		};
		files: {
			label: string;
			description: string;
		};
		stashes: {
			label: string;
			description: string;
		};
	};
	pageItemLimit: number;
	showRelativeDateMarkers: boolean;
}

export const viewsCommonConfigKeys: (keyof ViewsCommonConfig)[] = [
	'defaultItemLimit',
	'formats',
	'pageItemLimit',
	'showRelativeDateMarkers',
];

interface ViewsConfigs {
	branches: BranchesViewConfig;
	commits: CommitsViewConfig;
	contributors: ContributorsViewConfig;
	fileHistory: FileHistoryViewConfig;
	lineHistory: LineHistoryViewConfig;
	remotes: RemotesViewConfig;
	repositories: RepositoriesViewConfig;
	searchAndCompare: SearchAndCompareViewConfig;
	stashes: StashesViewConfig;
	tags: TagsViewConfig;
}

export type ViewsConfigKeys = keyof ViewsConfigs;
export const viewsConfigKeys: ViewsConfigKeys[] = [
	'commits',
	'repositories',
	'fileHistory',
	'lineHistory',
	'branches',
	'remotes',
	'stashes',
	'tags',
	'contributors',
	'searchAndCompare',
];

export type ViewsConfig = ViewsCommonConfig & ViewsConfigs;

export interface BranchesViewConfig {
	avatars: boolean;
	branches: {
		layout: ViewBranchesLayout;
	};
	files: ViewsFilesConfig;
	pullRequests: {
		enabled: boolean;
		showForBranches: boolean;
		showForCommits: boolean;
	};
	reveal: boolean;
	showBranchComparison: false | ViewShowBranchComparison.Branch;
}

export interface CommitsViewConfig {
	avatars: boolean;
	branches: undefined;
	files: ViewsFilesConfig;
	pullRequests: {
		enabled: boolean;
		showForBranches: boolean;
		showForCommits: boolean;
	};
	reveal: boolean;
	showBranchComparison: false | ViewShowBranchComparison;
}

export interface ContributorsViewConfig {
	avatars: boolean;
	files: ViewsFilesConfig;
	pullRequests: {
		enabled: boolean;
		showForCommits: boolean;
	};
	showAllBranches: boolean;
	showStatistics: boolean;
}

export interface FileHistoryViewConfig {
	avatars: boolean;
	files: ViewsFilesConfig;
}

export interface LineHistoryViewConfig {
	avatars: boolean;
}

export interface RemotesViewConfig {
	avatars: boolean;
	branches: {
		layout: ViewBranchesLayout;
	};
	files: ViewsFilesConfig;
	pullRequests: {
		enabled: boolean;
		showForBranches: boolean;
		showForCommits: boolean;
	};
	reveal: boolean;
}

export interface RepositoriesViewConfig {
	autoRefresh: boolean;
	autoReveal: boolean;
	avatars: boolean;
	branches: {
		layout: ViewBranchesLayout;
		showBranchComparison: false | ViewShowBranchComparison.Branch;
	};
	compact: boolean;
	files: ViewsFilesConfig;
	includeWorkingTree: boolean;
	pullRequests: {
		enabled: boolean;
		showForBranches: boolean;
		showForCommits: boolean;
	};
	showBranchComparison: false | ViewShowBranchComparison;
	showBranches: boolean;
	showCommits: boolean;
	showContributors: boolean;
	showIncomingActivity: boolean;
	showRemotes: boolean;
	showStashes: boolean;
	showTags: boolean;
	showUpstreamStatus: boolean;
}

export interface SearchAndCompareViewConfig {
	avatars: boolean;
	files: ViewsFilesConfig;
	pullRequests: {
		enabled: boolean;
		showForCommits: boolean;
	};
}

export interface StashesViewConfig {
	files: ViewsFilesConfig;
	reveal: boolean;
}

export interface TagsViewConfig {
	avatars: boolean;
	branches: {
		layout: ViewBranchesLayout;
	};
	files: ViewsFilesConfig;
	reveal: boolean;
}

export interface ViewsFilesConfig {
	compact: boolean;
	layout: ViewFilesLayout;
	threshold: number;
}
