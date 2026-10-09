declare const ElementBase: {
    new (): HTMLElement;
    prototype: HTMLElement;
};
export declare class HieroglyphTag extends ElementBase {
    private source;
    private unicode;
    private generation;
    private observer;
    private output;
    private status;
    private unicodeButton;
    constructor();
    connectedCallback(): void;
    disconnectedCallback(): void;
    private update;
    private copy;
}
export declare function defineEgyptianHieroglyph(): void;
declare global {
    interface HTMLElementTagNameMap {
        'hieroglyph-tag': HieroglyphTag;
    }
}
export {};
