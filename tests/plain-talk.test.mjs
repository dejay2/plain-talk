import assert from "node:assert/strict";
import test from "node:test";

import plainTalk from "../extensions/plain-talk.ts";

const TYPE_OWN_ANSWER = "✏️ Type my own answer";
const QUESTION = "Which option do you want?";
const PARAMS = {
	question: QUESTION,
	options: [{ label: "First choice" }, { label: "Second choice" }],
};
const BLOCKED_EVENT = {
	name: "herdr:blocked",
	data: { active: true, label: QUESTION },
};
const CLEARED_EVENT = {
	name: "herdr:blocked",
	data: { active: false },
};

function loadAskTool() {
	const events = [];
	let askTool;
	const pi = {
		on() {},
		registerCommand() {},
		registerTool(tool) {
			if (tool.name === "ask") askTool = tool;
		},
		events: {
			emit(name, data) {
				events.push({ name, data });
			},
		},
	};

	plainTalk(pi);
	assert.ok(askTool, "plain-talk should register its ask tool");
	return { askTool, events };
}

function executeAsk(askTool, ctx, signal) {
	return askTool.execute("question-1", PARAMS, signal, undefined, ctx);
}

function interactiveContext({ select, input = async () => undefined }) {
	return {
		hasUI: true,
		ui: { select, input },
	};
}

const nextTick = () => new Promise((resolve) => setImmediate(resolve));

function pendingScreen(controller, opened) {
	return (...args) => {
		const options = args.at(-1);
		opened.resolve();
		assert.equal(options.signal, controller.signal);
		return new Promise((resolve) => {
			options.signal.addEventListener("abort", () => resolve(undefined), { once: true });
		});
	};
}

test("reports blocked for the full question, including a typed answer", async () => {
	const select = Promise.withResolvers();
	const input = Promise.withResolvers();
	const { askTool, events } = loadAskTool();
	const execution = executeAsk(
		askTool,
		interactiveContext({
			select: () => select.promise,
			input: () => input.promise,
		}),
	);

	try {
		assert.deepEqual(events, [BLOCKED_EVENT]);

		select.resolve(TYPE_OWN_ANSWER);
		await nextTick();
		assert.deepEqual(events, [BLOCKED_EVENT]);

		input.resolve("My own answer");
		assert.deepEqual(await execution, {
			content: [{ type: "text", text: 'The user typed their own answer: "My own answer"' }],
			details: {
				question: QUESTION,
				options: ["First choice", "Second choice"],
				answer: "My own answer",
				wasCustom: true,
			},
		});
		assert.deepEqual(events, [BLOCKED_EVENT, CLEARED_EVENT]);
	} finally {
		select.resolve(TYPE_OWN_ANSWER);
		input.resolve("My own answer");
		await execution.catch(() => undefined);
	}
});

test("returns a menu choice and clears blocked", async () => {
	const { askTool, events } = loadAskTool();
	const result = await executeAsk(
		askTool,
		interactiveContext({ select: async () => "Second choice" }),
	);

	assert.deepEqual(result, {
		content: [{ type: "text", text: "The user picked: 2. Second choice" }],
		details: {
			question: QUESTION,
			options: ["First choice", "Second choice"],
			answer: "Second choice",
		},
	});
	assert.deepEqual(events, [BLOCKED_EVENT, CLEARED_EVENT]);
});

test("stopping while the menu is open clears blocked", async () => {
	const controller = new AbortController();
	const opened = Promise.withResolvers();
	const { askTool, events } = loadAskTool();
	const execution = executeAsk(
		askTool,
		interactiveContext({ select: pendingScreen(controller, opened) }),
		controller.signal,
	);

	await opened.promise;
	assert.deepEqual(events, [BLOCKED_EVENT]);

	controller.abort();
	assert.deepEqual(await execution, {
		content: [
			{
				type: "text",
				text: "The user closed the question without answering. Do not guess — continue only if you safely can, otherwise wait for the user.",
			},
		],
		details: {
			question: QUESTION,
			options: ["First choice", "Second choice"],
			answer: null,
		},
	});
	assert.deepEqual(events, [BLOCKED_EVENT, CLEARED_EVENT]);
});

test("stopping while the typing box is open clears blocked", async () => {
	const controller = new AbortController();
	const opened = Promise.withResolvers();
	const { askTool, events } = loadAskTool();
	const execution = executeAsk(
		askTool,
		interactiveContext({
			select: async () => TYPE_OWN_ANSWER,
			input: pendingScreen(controller, opened),
		}),
		controller.signal,
	);

	await opened.promise;
	assert.deepEqual(events, [BLOCKED_EVENT]);

	controller.abort();
	assert.deepEqual(await execution, {
		content: [{ type: "text", text: "The user closed the question without answering." }],
		details: {
			question: QUESTION,
			options: ["First choice", "Second choice"],
			answer: null,
		},
	});
	assert.deepEqual(events, [BLOCKED_EVENT, CLEARED_EVENT]);
});

test("a question stopped before opening sends no Herdr events", async () => {
	const controller = new AbortController();
	controller.abort();
	let opened = false;
	const { askTool, events } = loadAskTool();
	const result = await executeAsk(
		askTool,
		interactiveContext({
			select: async () => {
				opened = true;
				return undefined;
			},
		}),
		controller.signal,
	);

	assert.deepEqual(result, {
		content: [
			{
				type: "text",
				text: "The user closed the question without answering. Do not guess — continue only if you safely can, otherwise wait for the user.",
			},
		],
		details: {
			question: QUESTION,
			options: ["First choice", "Second choice"],
			answer: null,
		},
	});
	assert.equal(opened, false);
	assert.deepEqual(events, []);
});

for (const testCase of [
	{
		name: "closing the menu",
		select: async () => undefined,
		input: async () => undefined,
		expectedText:
			"The user closed the question without answering. Do not guess — continue only if you safely can, otherwise wait for the user.",
	},
	{
		name: "closing the typing box",
		select: async () => TYPE_OWN_ANSWER,
		input: async () => undefined,
		expectedText: "The user closed the question without answering.",
	},
	{
		name: "submitting a blank typed answer",
		select: async () => TYPE_OWN_ANSWER,
		input: async () => "   ",
		expectedText: "The user closed the question without answering.",
	},
]) {
	test(`${testCase.name} clears blocked`, async () => {
		const { askTool, events } = loadAskTool();
		const result = await executeAsk(
			askTool,
			interactiveContext({ select: testCase.select, input: testCase.input }),
		);

		assert.deepEqual(result, {
			content: [{ type: "text", text: testCase.expectedText }],
			details: {
				question: QUESTION,
				options: ["First choice", "Second choice"],
				answer: null,
			},
		});
		assert.deepEqual(events, [BLOCKED_EVENT, CLEARED_EVENT]);
	});
}

for (const testCase of [
	{
		name: "menu error",
		select: async () => {
			throw new Error("menu failed");
		},
		input: async () => undefined,
		expectedError: /menu failed/,
	},
	{
		name: "typing-box error",
		select: async () => TYPE_OWN_ANSWER,
		input: async () => {
			throw new Error("input failed");
		},
		expectedError: /input failed/,
	},
]) {
	test(`${testCase.name} clears blocked`, async () => {
		const { askTool, events } = loadAskTool();
		await assert.rejects(
			executeAsk(
				askTool,
				interactiveContext({ select: testCase.select, input: testCase.input }),
			),
			testCase.expectedError,
		);
		assert.deepEqual(events, [BLOCKED_EVENT, CLEARED_EVENT]);
	});
}

test("use without an interactive screen sends no Herdr events", async () => {
	const { askTool, events } = loadAskTool();
	const result = await executeAsk(askTool, { hasUI: false });

	assert.deepEqual(result, {
		content: [
			{
				type: "text",
				text: "Interactive UI is not available here. Ask the question in plain text instead, as a simple numbered menu, and let the user reply with a number or their own words.",
			},
		],
		details: {
			question: QUESTION,
			options: ["First choice", "Second choice"],
			answer: null,
		},
	});
	assert.deepEqual(events, []);
});
