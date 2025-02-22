import { attr, css, customElement, FASTElement, html, observable, volatile, when } from '@microsoft/fast-element';
import { isMac } from '@env/platform';
import { pluralize } from '../../../../../system/string';
import type { Disposable } from '../../dom';
import { DOM } from '../../dom';
import { numberConverter } from '../converters/number-converter';
import '../codicon';
import './search-input';

const template = html<SearchBox>`<template>
	<search-input
		id="search-input"
		errorMessage="${x => x.errorMessage}"
		label="${x => x.label}"
		placeholder="${x => x.placeholder}"
		matchAll="${x => x.matchAll}"
		matchCase="${x => x.matchCase}"
		matchRegex="${x => x.matchRegex}"
		value="${x => x.value}"
		@previous="${(x, c) => x.handlePrevious(c.event)}"
		@next="${(x, c) => x.handleNext(c.event)}"
	></search-input>
	<div class="search-navigation" aria-label="Search navigation">
		<span class="count${x => (x.total < 1 && x.valid ? ' error' : '')}">
			${when(x => x.total < 1, html<SearchBox>`${x => x.formattedLabel}`)}
			${when(
				x => x.total > 0,
				html<SearchBox>`<span aria-current="step">${x => x.step}</span> of
					${x => x.total}${x => (x.more ? '+' : '')}<span class="sr-only"> ${x => x.formattedLabel}</span>`,
			)}
		</span>
		<button
			type="button"
			class="button"
			?disabled="${x => !x.hasPrevious}"
			@click="${(x, c) => x.handlePrevious(c.event)}"
		>
			<code-icon
				icon="arrow-up"
				aria-label="Previous Match (Shift+Enter)"
				title="Previous Match (Shift+Enter)"
			></code-icon>
		</button>
		<button type="button" class="button" ?disabled="${x => !x.hasNext}" @click="${(x, c) => x.handleNext(c.event)}">
			<code-icon icon="arrow-down" aria-label="Next Match (Enter)" title="Next Match (Enter)"></code-icon>
		</button>
		<button
			type="button"
			class="button"
			?disabled="${x => !x.value}"
			@click="${(x, c) => x.handleOpenInView(c.event)}"
		>
			<code-icon
				icon="link-external"
				aria-label="Show Results in Side Bar"
				title="Show Results in Side Bar"
			></code-icon>
		</button>
	</div>
</template>`;

const styles = css`
	:host {
		display: inline-flex;
		flex-direction: row;
		align-items: center;
		gap: 0.8rem;
		color: var(--vscode-titleBar-inactiveForeground);
		flex: auto 1 1;
	}
	:host(:focus) {
		outline: 0;
	}

	.search-navigation {
		display: inline-flex;
		flex-direction: row;
		align-items: center;
		gap: 0.8rem;
		color: var(--vscode-titleBar-inactiveForeground);
	}
	.search-navigation:focus {
		outline: 0;
	}

	.count {
		flex: none;
		margin-right: 0.4rem;
		font-size: 1.2rem;
		min-width: 10ch;
	}

	.count.error {
		color: var(--vscode-errorForeground);
	}

	.button {
		width: 2.4rem;
		height: 2.4rem;
		padding: 0;
		color: inherit;
		border: none;
		background: none;
		text-align: center;
	}
	.button:focus {
		outline: 1px solid var(--vscode-focusBorder);
		outline-offset: -1px;
	}
	.button:not([disabled]) {
		cursor: pointer;
	}
	.button:hover:not([disabled]) {
		background-color: var(--vscode-titleBar-activeBackground);
	}
	.button > code-icon[icon='arrow-up'] {
		transform: translateX(-0.1rem);
	}

	.sr-only {
		clip: rect(0 0 0 0);
		clip-path: inset(50%);
		height: 1px;
		overflow: hidden;
		position: absolute;
		white-space: nowrap;
		width: 1px;
	}
`;

@customElement({ name: 'search-box', template: template, styles: styles })
export class SearchBox extends FASTElement {
	@observable
	errorMessage = '';

	@attr
	label = 'Search';

	@attr
	placeholder = 'Search commits, e.g. "Updates dependencies" author:eamodio';

	@attr
	value = '';

	@attr({ mode: 'boolean' })
	matchAll = false;

	@attr({ mode: 'boolean' })
	matchCase = false;

	@attr({ mode: 'boolean' })
	matchRegex = true;

	@attr({ converter: numberConverter })
	total = 0;

	@attr({ converter: numberConverter })
	step = 0;

	@attr({ mode: 'boolean' })
	more = false;

	@attr({ mode: 'boolean' })
	valid = false;

	@attr
	resultsLabel = 'result';

	@volatile
	get formattedLabel() {
		return pluralize(this.resultsLabel, this.total, { zero: 'No' });
	}

	@volatile
	get hasPrevious() {
		return this.total !== 0;
	}

	@volatile
	get hasNext() {
		return this.total !== 0;
	}

	private _disposable: Disposable | undefined;

	override connectedCallback(): void {
		super.connectedCallback();

		this._disposable = DOM.on(window, 'keyup', e => this.handleShortcutKeys(e));
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();

		this._disposable?.dispose();
	}

	override focus(options?: FocusOptions): void {
		this.shadowRoot?.getElementById('search-input')?.focus(options);
	}

	next() {
		this.$emit('next');
	}

	previous() {
		this.$emit('previous');
	}

	handleShortcutKeys(e: KeyboardEvent) {
		if (e.altKey) return;

		if ((e.key === 'F3' && !e.ctrlKey && !e.metaKey) || (e.key === 'g' && e.metaKey && !e.ctrlKey && isMac)) {
			e.preventDefault();
			e.stopImmediatePropagation();

			if (e.shiftKey) {
				this.previous();
			} else {
				this.next();
			}

			return;
		}

		if (e.key === 'f' && ((e.metaKey && !e.ctrlKey && isMac) || (e.ctrlKey && !isMac))) {
			e.preventDefault();
			e.stopImmediatePropagation();

			this.focus();
		}
	}

	handlePrevious(e: Event) {
		e.stopImmediatePropagation();
		this.previous();
	}

	handleNext(e: Event) {
		e.stopImmediatePropagation();
		this.next();
	}

	handleOpenInView(e: Event) {
		e.stopImmediatePropagation();
		this.$emit('openinview');
	}
}
