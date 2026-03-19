import Def from 'autocomplete-lhc';

interface AutocompleteWithMoreResults {
  listContainer?: HTMLElement;
  handleSeeMoreItems(event: Event): void;
}

/**
 * Guards the autocomplete-lhc "See more items" interaction to avoid click
 * leakage into global dialog handlers while preserving list expansion behavior.
 */
export class AutocompleteMoreResultsGuard {
  private moreResultsMouseDownListener: ((event: Event) => void) | null = null;
  private moreResultsContainerMouseDownCaptureListener: ((event: Event) => void) | null = null;
  private suppressNextClickListener: ((event: Event) => void) | null = null;
  private moreResultsActionElement: HTMLElement | null = null;
  private previousMoreResultsPointerEvents: string | null = null;

  /**
   * Creates a guard instance for a single autocomplete field.
   *
   * @param autoComplete - The autocomplete-lhc instance (Search/Prefetch) whose
   * "See more items" behavior should be guarded.
   * @param autoCompleteElement - The input element associated with the
   * autocomplete instance.
   * @param expectedFieldId - The field id that must match
   * `Def.Autocompleter.currentAutoCompField_` before handling events.
   */
  constructor(
    private autoComplete: AutocompleteWithMoreResults,
    private autoCompleteElement: HTMLElement,
    private expectedFieldId: string
  ) {}

  /**
   * Attaches the guard behavior to the shared "See more items" element.
   *
   * The handler is scoped to the current active field and suppresses event
   * leakage that can trigger global dialog click handlers.
   *
   * @returns void
   */
  attach(): void {
    const listContainer = this.autoComplete?.listContainer as HTMLElement | undefined;
    if (!listContainer) {
      return;
    }

    const moreResults = listContainer.querySelector('#lhc-tools-moreResults') as HTMLElement | null;
    if (!moreResults) {
      return;
    }

    // Bind the handler to an inner inline element so only the link text area
    // is clickable (instead of the full width of #lhc-tools-moreResults).
    this.moreResultsActionElement = this.ensureMoreResultsActionElement(moreResults);

    // Make only the action text clickable; clicking blank area in the row should
    // not trigger expansion.
    this.previousMoreResultsPointerEvents = moreResults.style.pointerEvents || null;
    moreResults.style.pointerEvents = 'none';
    this.moreResultsActionElement.style.pointerEvents = 'auto';

    // Block package-level expansion when users click blank space in the row.
    // Only clicks within the inner action element should be allowed through.
    this.moreResultsContainerMouseDownCaptureListener = (event: Event) => {
      const composedPath = typeof event.composedPath === 'function' ? event.composedPath() : [];
      const clickedAction = this.moreResultsActionElement
        ? composedPath.includes(this.moreResultsActionElement)
        : false;

      if (clickedAction) {
        return;
      }

      // Prevent the autocomplete-lhc listener on #lhc-tools-moreResults from
      // treating the full row as clickable.
      event.stopImmediatePropagation();
    };

    moreResults.addEventListener('mousedown', this.moreResultsContainerMouseDownCaptureListener, true);

    this.moreResultsMouseDownListener = (event: Event) => {
      // Only handle for the active field to avoid cross-triggering when
      // multiple autocomplete controls are on the page.
      if (Def.Autocompleter.currentAutoCompField_ !== this.expectedFieldId) {
        return;
      }

      // If the action element or parent row is hidden, do nothing.
      if (moreResults.style.display === 'none' ||
          this.moreResultsActionElement?.style.display === 'none') {
        return;
      }

      // Prevent this pointer interaction from bubbling into global click
      // handlers (e.g. base dialog overlay close logic).
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      // In some browsers, after mousedown causes list redraw/reposition,
      // the subsequent click can land on a different element (such as dialog
      // close controls). Suppress only that next click.
      this.attachSuppressNextClickListener();

      this.autoComplete.handleSeeMoreItems(event);
      Def.Autocompleter.Event.notifyObservers(this.autoCompleteElement, 'LIST_EXP', {
        list_expansion_method: 'clicked'
      });
    };

    this.moreResultsActionElement.addEventListener('mousedown', this.moreResultsMouseDownListener);
  }

  /**
   * Detaches all listeners created by this guard.
   *
   * @returns void
   */
  detach(): void {
    this.detachMoreResultsFallbackListener();
    this.detachSuppressNextClickListener();
  }

  /**
   * Removes the fallback mousedown listener from the "See more items" element.
   *
   * @returns void
   */
  private detachMoreResultsFallbackListener(): void {
    if (!this.moreResultsMouseDownListener || !this.autoComplete?.listContainer) {
      return;
    }

    if (this.moreResultsActionElement) {
      this.moreResultsActionElement.removeEventListener('mousedown', this.moreResultsMouseDownListener);
    }

    const moreResults = (this.autoComplete.listContainer as HTMLElement)
      .querySelector('#lhc-tools-moreResults') as HTMLElement | null;

    if (moreResults && this.moreResultsContainerMouseDownCaptureListener) {
      moreResults.removeEventListener('mousedown', this.moreResultsContainerMouseDownCaptureListener, true);
    }

    this.moreResultsMouseDownListener = null;
    this.moreResultsContainerMouseDownCaptureListener = null;
    if (moreResults) {
      moreResults.style.pointerEvents = this.previousMoreResultsPointerEvents ?? '';
    }
    this.previousMoreResultsPointerEvents = null;
    this.moreResultsActionElement = null;
  }

  /**
   * Ensures there is an inline action element inside #lhc-tools-moreResults
   * and returns it as the mousedown target.
   *
   * @param moreResults - The #lhc-tools-moreResults container element.
   * @returns The inner action element to bind the event handler to.
   */
  private ensureMoreResultsActionElement(moreResults: HTMLElement): HTMLElement {
    const existing = moreResults.querySelector('[data-lhc-more-results-action="true"]') as HTMLElement | null;
    if (existing) {
      return existing;
    }

    const action = document.createElement('span');
    action.setAttribute('data-lhc-more-results-action', 'true');
    action.textContent = moreResults.textContent?.trim() || 'See more items (Ctl Ret)';
    action.style.cursor = 'pointer';
    action.style.display = 'inline-block';

    moreResults.textContent = '';
    moreResults.appendChild(action);

    return action;
  }

  /**
   * Installs a one-time capture-phase click listener to suppress the next click
   * after mousedown expansion.
   *
   * This prevents accidental click-through to other UI elements while the list
   * is being re-rendered/repositioned.
   *
   * @returns void
   */
  private attachSuppressNextClickListener(): void {
    this.detachSuppressNextClickListener();

    this.suppressNextClickListener = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      this.detachSuppressNextClickListener();
    };

    document.addEventListener('click', this.suppressNextClickListener, true);
  }

  /**
   * Removes the one-time click suppression listener, if present.
   *
   * @returns void
   */
  private detachSuppressNextClickListener(): void {
    if (!this.suppressNextClickListener) {
      return;
    }

    document.removeEventListener('click', this.suppressNextClickListener, true);
    this.suppressNextClickListener = null;
  }
}
