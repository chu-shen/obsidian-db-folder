import { EventEmitter } from 'eventemitter3';

import { SearchResult } from 'components/cellTypes/Editor/textcomplete/textcomplete-core/SearchResult';
import { createCustomEvent } from 'components/cellTypes/Editor/textcomplete/textcomplete-core/utils';

export interface CursorOffset {
  lineHeight: number;
  top: number;
  left?: number;
  right?: number;
  clientTop?: number;
}

type KeyCode = 'ESC' | 'ENTER' | 'UP' | 'DOWN' | 'OTHER';

export abstract class Editor extends EventEmitter {
  /**
   * Finalize the editor object.
   *
   * It is called when associated textcomplete object is destroyed.
   */
  destroy(): this {
    return this;
  }

  /**
   * It is called when a search result is selected by a user.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  applySearchResult(_result: SearchResult<unknown>): void {
    throw new Error('Not implemented.');
  }

  /**
   * The input cursor's absolute coordinates from the window's left
   * top corner.
   */
  getCursorOffset(): CursorOffset {
    throw new Error('Not implemented.');
  }

  /**
   * Editor string value from head to the cursor.
   * Returns null if selection type is range not cursor.
   */
  getBeforeCursor(): string | null {
    throw new Error('Not implemented.');
  }

  /**
   * Emit a move event, which moves active dropdown element.
   * Child class must call this method at proper timing with proper parameter.
   *
   * @see {@link Textarea} for live example.
   */
  emitMoveEvent(code: 'UP' | 'DOWN'): CustomEvent {
    const moveEvent = createCustomEvent('move', {
      cancelable: true,
      detail: {
        code: code,
      },
    });
    this.emit('move', moveEvent);
    return moveEvent;
  }

  /**
   * Emit a enter event, which selects current search result.
   * Child class must call this method at proper timing.
   *
   * @see {@link Textarea} for live example.
   */
  emitEnterEvent(): CustomEvent {
    const enterEvent = createCustomEvent('enter', {
      cancelable: true,
    });
    this.emit('enter', enterEvent);
    return enterEvent;
  }

  /**
   * Emit a change event, which triggers auto completion.
   * Child class must call this method at proper timing.
   *
   * @see {@link Textarea} for live example.
   */
  emitChangeEvent(): CustomEvent {
    const changeEvent = createCustomEvent('change', {
      detail: {
        beforeCursor: this.getBeforeCursor(),
      },
    });
    this.emit('change', changeEvent);
    return changeEvent;
  }

  /**
   * Emit a esc event, which hides dropdown element.
   * Child class must call this method at proper timing.
   *
   * @see {@link Textarea} for live example.
   */
  emitEscEvent(): CustomEvent {
    const escEvent = createCustomEvent('esc', {
      cancelable: true,
    });
    this.emit('esc', escEvent);
    return escEvent;
  }

  /**
   * Helper method for parsing KeyboardEvent.
   *
   * @see {@link Textarea} for live example.
   */
  protected getCode(e: KeyboardEvent): KeyCode {
    let code: KeyCode = 'OTHER';
    switch (e.key) {
      case 'Enter':
      case 'Tab':
        code = 'ENTER';
        break;
      case 'Escape':
        code = 'ESC';
        break;
      case 'ArrowUp':
        code = 'UP';
        break;
      case 'ArrowDown':
        code = 'DOWN';
        break;
      case 'n':
        if (e.ctrlKey) {
          code = 'DOWN';
        }
        break;
      case 'p':
        if (e.ctrlKey) {
          code = 'UP';
        }
        break;
      default:
      // do nothing
    }
    return code;
  }
}
