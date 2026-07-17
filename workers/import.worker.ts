/// <reference lib="webworker" />
import { BlobReader, ZipReader } from "@zip.js/zip.js";
import { createJsonObjectStreamParser } from "@/lib/import/array-parser";
import { sanitizeRecord } from "@/lib/import/sanitize";
import type { DetectedMember, ImportPreview, ImportWorkerResponse, RawGroupMeMessage, SanitizedEvent, SanitizedMessage } from "@/lib/import/types";

const scope: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;
let rows = 0, skipped = 0, eventTotal = 0, minDate: string | null = null, maxDate: string | null = null;
let messages: SanitizedMessage[] = [], events: SanitizedEvent[] = [];
const members = new Map<string, DetectedMember>();
const memberLatestAt = new Map<string, string>();
const messageIds = new Set<string>();
const eventIds = new Set<string>();

function post(payload: ImportWorkerResponse) { scope.postMessage(payload); }
function flush() { if (messages.length || events.length) { post({ type: "message-batch", messages, events }); messages = []; events = []; } }

function handleObject(value: unknown) {
  rows += 1;
  if (!value || typeof value !== "object" || Array.isArray(value)) { skipped += 1; return; }
  const clean = sanitizeRecord(value as RawGroupMeMessage);
  if (clean.warning) skipped += 1;
  if (clean.message) {
    if (messageIds.has(clean.message.source_message_id)) { skipped += 1; return; }
    messageIds.add(clean.message.source_message_id);
    messages.push(clean.message);
    minDate = !minDate || clean.message.occurred_at < minDate ? clean.message.occurred_at : minDate;
    maxDate = !maxDate || clean.message.occurred_at > maxDate ? clean.message.occurred_at : maxDate;
    if (clean.member) {
      const existing = members.get(clean.member.id); const latest = memberLatestAt.get(clean.member.id);
      members.set(clean.member.id, { source_user_id: clean.member.id, display_name: !latest || clean.message.occurred_at >= latest ? clean.member.name : existing?.display_name ?? clean.member.name, message_count: (existing?.message_count ?? 0) + 1 });
      if (!latest || clean.message.occurred_at >= latest) memberLatestAt.set(clean.member.id, clean.message.occurred_at);
    }
  }
  if (clean.event) { if (eventIds.has(clean.event.source_event_id)) { skipped += 1; return; } eventIds.add(clean.event.source_event_id); events.push(clean.event); eventTotal += 1; }
  if (messages.length + events.length >= 1000) flush();
}

async function parseStream(stream: ReadableStream<Uint8Array>, totalBytes: number) {
  const parser = createJsonObjectStreamParser(handleObject); const decoder = new TextDecoder(); const reader = stream.getReader(); let consumed = 0;
  while (true) { const { done, value } = await reader.read(); if (done) break; consumed += value.byteLength; parser.feed(decoder.decode(value, { stream: true })); post({ type: "progress", progress: Math.min(98, Math.round(consumed / Math.max(totalBytes, 1) * 100)), rows }); }
  parser.feed(decoder.decode()); parser.finish();
}

async function parseZip(file: File) {
  const reader = new ZipReader(new BlobReader(file));
  try {
    const entries = await reader.getEntries();
    const entry = entries.find((item) => !item.directory && /(^|\/)message\.json$/i.test(item.filename));
    if (!entry || entry.directory) throw new Error("This ZIP does not contain a message.json file.");
    const parser = createJsonObjectStreamParser(handleObject); const decoder = new TextDecoder(); let consumed = 0;
    const writable = new WritableStream<Uint8Array>({ write(chunk) { consumed += chunk.byteLength; parser.feed(decoder.decode(chunk, { stream: true })); post({ type: "progress", progress: Math.min(98, Math.round(consumed / Math.max(entry.uncompressedSize, 1) * 100)), rows }); }, close() { parser.feed(decoder.decode()); parser.finish(); } });
    await entry.getData(writable);
  } finally { await reader.close(); }
}

scope.onmessage = async (event: MessageEvent<{ file: File }>) => {
  try {
    rows = 0; skipped = 0; eventTotal = 0; minDate = null; maxDate = null; messages = []; events = []; members.clear(); memberLatestAt.clear(); messageIds.clear(); eventIds.clear();
    const { file } = event.data;
    if (/\.zip$/i.test(file.name)) await parseZip(file); else if (/\.json$/i.test(file.name)) await parseStream(file.stream(), file.size); else throw new Error("Choose a GroupMe ZIP export or message.json file.");
    flush();
    const preview: ImportPreview = { rowCount: rows, messageCount: Array.from(members.values()).reduce((sum, member) => sum + member.message_count, 0), eventCount: eventTotal, skippedCount: skipped, minDate, maxDate, members: Array.from(members.values()).sort((a,b)=>b.message_count-a.message_count), warnings: skipped ? [`${skipped.toLocaleString()} malformed or unsupported records will be skipped.`] : [] };
    post({ type: "progress", progress: 100, rows }); post({ type: "complete", preview });
  } catch (error) { post({ type: "error", error: error instanceof Error ? error.message : "The export could not be parsed." }); }
};

export {};
