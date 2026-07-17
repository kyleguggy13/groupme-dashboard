import { describe, expect, it } from "vitest";
import { createJsonObjectStreamParser } from "@/lib/import/array-parser";

describe("createJsonObjectStreamParser", () => {
  it("parses records split across arbitrary chunks", () => {
    const output: unknown[] = [];
    const parser = createJsonObjectStreamParser((value) => output.push(value));
    ['[{"id":999999999999999999,"text":"brace } and \\"quote","nested":', '{"ok":true}},', '{"id":"two","name":"Zoë ❤️"}]'].forEach((chunk) => parser.feed(chunk));
    parser.finish();
    expect(output).toHaveLength(2);
    expect((output[0] as { id: string }).id).toBe("999999999999999999");
    expect((output[1] as { name: string }).name).toBe("Zoë ❤️");
  });

  it("reports a truncated export", () => {
    const parser = createJsonObjectStreamParser(() => undefined);
    parser.feed('[{"id":"one"');
    expect(() => parser.finish()).toThrow(/ended before/);
  });
});
