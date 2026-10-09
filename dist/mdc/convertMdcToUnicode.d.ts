export interface MdcConversion {
    unicode: string;
    warnings: string[];
}
/** Pure, synchronous conversion. No font, browser DOM, or preview is needed. */
export declare function convertMdcToUnicode(source: string): MdcConversion;
