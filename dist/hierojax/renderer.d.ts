export declare function loadHieroglyphicFont(): Promise<void>;
/** The caller must await font readiness before glyph measurement. */
export declare function renderHieroglyphicUnicode(host: HTMLElement, unicode: string, fontsize: number): void;
