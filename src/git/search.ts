'use strict';
import { GitRevision } from './git';
import { GitRevisionReference } from './models/models';

export type SearchOperators =
	| ''
	| '=:'
	| 'message:'
	| '@:'
	| 'author:'
	| '#:'
	| 'commit:'
	| '?:'
	| 'file:'
	| '~:'
	| 'change:';

export const searchOperators = new Set<string>([
	'',
	'=:',
	'message:',
	'@:',
	'author:',
	'#:',
	'commit:',
	'?:',
	'file:',
	'~:',
	'change:',
]);

export interface SearchPattern {
	pattern: string;
	matchAll?: boolean;
	matchCase?: boolean;
	matchRegex?: boolean;
}

export namespace SearchPattern {
	const emptyStr = '';

	const searchMessageValuesRegex = /(".+"|[^\b\s]+)/g;
	const searchOperationRegex =
		/((?:=|message|@|author|#|commit|\?|file|~|change):)\s?(.*?)(?=\s?(?:(?:=:|message:|@:|author:|#:|commit:|\?:|file:|~:|change:)|$))/g;

	export function fromCommit(ref: string): string;
	export function fromCommit(commit: GitRevisionReference): string;
	export function fromCommit(refOrCommit: string | GitRevisionReference) {
		return `#:${typeof refOrCommit === 'string' ? GitRevision.shorten(refOrCommit) : refOrCommit.name}`;
	}

	export function fromCommits(refs: string[]): string;
	export function fromCommits(commits: GitRevisionReference[]): string;
	export function fromCommits(refsOrCommits: (string | GitRevisionReference)[]) {
		return refsOrCommits.map(r => `#:${typeof r === 'string' ? GitRevision.shorten(r) : r.name}`).join(' ');
	}

	export function parseSearchOperations(search: string): Map<string, string[]> {
		const operations = new Map<string, string[]>();

		let op;
		let value;
		let freeTextTerm;

		let match = searchOperationRegex.exec(search);

		if (match == null || match.index > 0) {
			freeTextTerm = search.substring(0, match?.index).trimEnd();
		}

		while (match != null) {
			[, op, value] = match;

			if (op !== undefined) {
				op = normalizeSearchOperatorsMap.get(op as SearchOperators)!;
				let firstMessageMatch;

				if (op === 'message:') {
					parseSearchMessageOperations(value, operations);
				} else if (
					!freeTextTerm &&
					match.index + match[0].length === search.length &&
					(firstMessageMatch = new RegExp(searchMessageValuesRegex).exec(value)) != null
				) {
					const [, firstMessage] = firstMessageMatch;
					addSearchOperationValue(op, firstMessage, operations);
					freeTextTerm = value.substring(firstMessage.length).trimStart();
				} else {
					addSearchOperationValue(op, value, operations);
				}
			}

			match = searchOperationRegex.exec(search);
		}

		if (freeTextTerm) {
			if (GitRevision.isSha(freeTextTerm)) {
				addSearchOperationValue('commit:', freeTextTerm, operations);
			} else {
				parseSearchMessageOperations(freeTextTerm, operations);
			}
		}

		return operations;
	}

	function addSearchOperationValue(op: SearchOperators, value: string, operations: Map<string, string[]>) {
		let values = operations.get(op);
		if (values === undefined) {
			values = [value];
			operations.set(op, values);
		} else {
			values.push(value);
		}
	}

	function parseSearchMessageOperations(message: string, operations: Map<string, string[]>) {
		if (message === emptyStr) {
			addSearchOperationValue('message:', emptyStr, operations);
			return;
		}

		let match;
		while ((match = searchMessageValuesRegex.exec(message)) != null) {
			const [, value] = match;
			addSearchOperationValue('message:', value, operations);
		}
	}

	export function toKey(search: SearchPattern) {
		return `${search.pattern}|${search.matchAll ? 'A' : ''}${search.matchCase ? 'C' : ''}${
			search.matchRegex ? 'R' : ''
		}`;
	}
}
export const normalizeSearchOperatorsMap = new Map<SearchOperators, SearchOperators>([
	['', 'message:'],
	['=:', 'message:'],
	['message:', 'message:'],
	['@:', 'author:'],
	['author:', 'author:'],
	['#:', 'commit:'],
	['commit:', 'commit:'],
	['?:', 'file:'],
	['file:', 'file:'],
	['~:', 'change:'],
	['change:', 'change:'],
]);
