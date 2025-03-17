// FILE: src/lib/apis/summarizers.ts

import { chatCompletion } from '$lib/apis/openai';      // For OpenAI calls
import { generateChatCompletion } from '$lib/apis/ollama'; // For Ollama calls
import { queryDoc } from '$lib/apis/retrieval';            // For RAG retrieval from knowledge bases
import type { SummarizerConfig } from '$lib/stores/summarizers';
import { splitStream } from '$lib/utils';
import { OPENAI_API_BASE_URL, OLLAMA_API_BASE_URL } from '$lib/constants';

/**
 * This function takes a single SummarizerConfig, performs local retrieval (if specified),
 * and returns exactly ONE final summary string ("summaryText") plus optional "sources."
 *
 * The plan:
 *  1) Retrieve text from a knowledge base (RAG) if knowledgeBaseIds is set.
 *  2) Combine user instructions + retrieved text into a single user prompt.
 *  3) Call either OpenAI or Ollama to summarize that prompt into a single final string.
 *  4) Return { summaryText, sources }.
 *
 *  If streaming is enabled, we *only* accumulate partial chunks internally and return them at the end.
 *  No partial messages are dispatched mid-way.
 */
export async function generateSummary(
	token: string,
	config: SummarizerConfig
): Promise<{
	summaryText: string;
	sources: any[];
}> {
	let summaryText = '';
	const sources: any[] = [];

	/**
	 * Step 1: (Optional) Local retrieval if there's a knowledge base specified.
	 * We just do a single doc retrieval on the first knowledgeBaseId,
	 * or you could adapt to loop multiple if needed.
	 */
	let retrievedText = '';
	if (config.knowledgeBaseIds && config.knowledgeBaseIds.length > 0) {
		try {
			const kbId = config.knowledgeBaseIds[0];
			const res = await queryDoc(token, kbId, config.instructions, config.topK);

			// The shape of 'res' can vary, so handle carefully:
			// Possible shapes:
			//   { documents: [["chunk #1","chunk #2"]], ... }
			//   [ { page_content, metadata }, ... ]
			if (res?.documents && Array.isArray(res.documents[0])) {
				// Merge all chunk texts
				retrievedText = res.documents[0].join('\n\n');
			} else if (Array.isArray(res)) {
				// Possibly array of { page_content, metadata }
				retrievedText = res
					.map((item: any) => item.page_content || '')
					.join('\n\n');
			}
		} catch (err) {
			console.error('Error retrieving doc for Summarizer:', err);
		}
	}

	/**
	 * Step 2: Construct final user prompt from instructions + retrieved text.
	 */
	const finalPrompt = `
You are to summarize the following knowledge according to the user instructions.

User Instructions:
${config.instructions}

Relevant Knowledge:
${retrievedText}
`.trim();

	/**
	 * Step 3: Build the request body for the LLM call.
	 * We pass ONLY the fields OpenAI or Ollama expects (model, messages, stream, etc.).
	 * (We do not include 'files' or other unsupported fields.)
	 */
	const requestBody: any = {
		model: config.modelId,
		messages: [
			{
				role: 'user',
				content: finalPrompt
			}
		],
		stream: config.noStream ? false : true
	};

	try {
		/**
		 * Step 4: Call either OpenAI or Ollama. We accumulate the final text
		 * into 'summaryText' and do NOT push partial responses externally.
		 */
		if (config.modelType === 'openai') {
			// In dev: goes to http://localhost:8080/openai/chat/completions
			const [res, controller] = await chatCompletion(token, requestBody, OPENAI_API_BASE_URL);

			if (!res.ok) {
				throw new Error(`OpenAI request failed with status ${res.status}`);
			}

			if (config.noStream) {
				// Non-stream parse
				const data = await res.json();
				if (data.error) {
					throw new Error(`OpenAI Summarizer error: ${data.error}`);
				}
				summaryText = data.choices?.[0]?.message?.content?.trim() || '**No content**';
			} else {
				// Streaming approach => accumulate the entire text
				const reader = res.body
					.pipeThrough(new TextDecoderStream())
					.pipeThrough(splitStream('\n'))
					.getReader();

				let done = false;
				while (!done) {
					const { value, done: chunkDone } = await reader.read();
					if (chunkDone) {
						done = true;
						break;
					}
					if (!value) continue;

					for (const line of value.split('\n')) {
						const trimmed = line.trim();
						if (!trimmed) continue;

						try {
							const chunk = JSON.parse(trimmed);
							if (chunk.error) {
								throw new Error(`OpenAI Summarizer error: ${chunk.error}`);
							}
							if (chunk.done === true) {
								done = true;
								break;
							}
							if (chunk.type === 'source' || chunk.type === 'citation') {
								sources.push(chunk.data);
							} else if (chunk.message?.content) {
								summaryText += chunk.message.content;
							}
						} catch (err) {
							console.error('Error parsing OpenAI chunk in Summarizer:', err);
						}
					}
				}
			}
		} else {
			// Ollama case => calls generateChatCompletion
			// That function typically does fetch to http://localhost:8080/ollama/api/chat
			const [res, controller] = await generateChatCompletion(token, requestBody);

			if (!res || !res.ok) {
				throw new Error('Ollama request failed or returned non-OK status');
			}

			if (config.noStream) {
				// Non-stream parse => single chunk
				const data = await res.json();
				if (data.error) {
					throw new Error(`Ollama Summarizer error: ${data.error}`);
				}
				summaryText = data.message?.content?.trim()  || '**No content**';
			} else {
				// Streaming => accumulate entire text
				const reader = res.body
					.pipeThrough(new TextDecoderStream())
					.pipeThrough(splitStream('\n'))
					.getReader();

				let done = false;
				while (!done) {
					const { value, done: chunkDone } = await reader.read();
					if (chunkDone) {
						done = true;
						break;
					}
					if (!value) continue;

					for (const line of value.split('\n')) {
						const trimmed = line.trim();
						if (!trimmed) continue;

						try {
							const chunk = JSON.parse(trimmed);

							if (chunk.error) {
								throw new Error(`Ollama Summarizer error: ${chunk.error}`);
							}
							if (chunk.done === true) {
								done = true;
								break;
							}
							if (chunk.type === 'source' || chunk.type === 'citation') {
								sources.push(chunk.data);
							} else if (chunk?.message?.content) {
								summaryText += chunk.message.content;
							}
						} catch (err) {
							console.error('Error parsing Ollama chunk in Summarizer:', err);
						}
					}
				}
			}
		}

		// Final single message / summary
		const finalText = summaryText.trim() || '**No content**';

		return {
			summaryText: finalText,
			sources
		};
	} catch (error) {
		console.error('Error generating summary:', error);
		return {
			summaryText: `**ERROR**: Summarization failed.\n${error}`,
			sources: []
		};
	}
}