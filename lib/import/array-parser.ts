export function createJsonObjectStreamParser(onObject: (value: unknown) => void) {
  let current = "";
  let depth = 0;
  let inString = false;
  let escaped = false;
  let started = false;

  return {
    feed(text: string) {
      for (const char of text) {
        if (!started) {
          if (char === "{") { started = true; depth = 1; current = "{"; }
          continue;
        }
        current += char;
        if (inString) {
          if (escaped) escaped = false;
          else if (char === "\\") escaped = true;
          else if (char === '"') inString = false;
          continue;
        }
        if (char === '"') inString = true;
        else if (char === "{") depth += 1;
        else if (char === "}") {
          depth -= 1;
          if (depth === 0) {
            const losslessIds = current.replace(/("(?:id|user_id|sender_id|group_id)"\s*:\s*)(-?\d{15,})(?=\s*[,}])/g, '$1"$2"');
            onObject(JSON.parse(losslessIds));
            current = "";
            started = false;
          }
        }
      }
    },
    finish() {
      if (started || inString || depth !== 0) throw new Error("The JSON export ended before a message record was complete.");
    },
  };
}
