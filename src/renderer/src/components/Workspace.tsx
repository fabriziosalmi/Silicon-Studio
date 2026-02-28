import { useState } from 'react'
import { PageHeader } from './ui/PageHeader'
import { Wand2, Sparkles, Languages, Copy, Loader2 } from 'lucide-react'
import { SimpleMdeReact } from "react-simplemde-editor";
import "simplemde/dist/simplemde.min.css";
import { useGlobalState } from '../context/GlobalState'
import { apiClient } from '../api/client'

export function Workspace() {
    const { activeModel } = useGlobalState()
    const [documentBody, setDocumentBody] = useState('# Project Alpha\n\nStart writing here or use the AI to generate content...')
    const [isGenerating, setIsGenerating] = useState(false)

    // Real AI Generation using the loaded model
    const handleAiCommand = async (command: string) => {
        if (!activeModel) {
            alert("Load a model first from the Models tab to use AI commands.");
            return;
        }

        setIsGenerating(true)

        const prompts: Record<string, string> = {
            continue: `Continue writing the following document naturally:\n\n${documentBody}`,
            summarize: `Provide a brief TL;DR summary of this document:\n\n${documentBody}`,
            draft: `Write an introduction section for the following document:\n\n${documentBody}`,
        };

        const prompt = prompts[command] || prompts.continue;

        try {
            const response = await fetch(`${apiClient.API_BASE}/api/engine/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model_id: activeModel.id,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                    max_tokens: 256
                })
            });

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let generated = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                if (data.text) generated += data.text;
                            } catch { /* skip */ }
                        }
                    }
                }
            }

            if (generated.trim()) {
                setDocumentBody(prev => prev + '\n\n' + generated.trim());
            }
        } catch (e: any) {
            alert(`AI generation failed: ${e.message}`);
        } finally {
            setIsGenerating(false);
        }
    }

    return (
        <div className="h-full flex flex-col text-white overflow-hidden pb-4">
            <PageHeader
                title="AI Notepad"
                description="Your distraction-free local workspace. Draft documents, code, or ideas with inline MLX intelligence."
                badge="BETA"
            />

            <div className="flex-1 flex gap-6 overflow-hidden min-h-0">

                {/* Editor Area */}
                <div className="flex-1 bg-[#18181B] border border-white/10 rounded-xl overflow-hidden shadow-xl flex flex-col relative group">

                    {/* Toolbar */}
                    <div className="h-12 border-b border-white/5 bg-white/[0.02] flex items-center px-4 justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500 hover:text-white cursor-pointer px-2 py-1 rounded hover:bg-white/5 disabled opacity-50">H1</span>
                            <span className="text-xs font-bold text-gray-500 hover:text-white cursor-pointer px-2 py-1 rounded hover:bg-white/5 disabled opacity-50">H2</span>
                            <div className="w-px h-4 bg-white/10 mx-2" />
                            <span className="text-xs font-bold text-gray-500 hover:text-white cursor-pointer px-2 py-1 rounded hover:bg-white/5 disabled opacity-50">B</span>
                            <span className="text-xs font-bold text-gray-500 hover:text-white cursor-pointer px-2 py-1 rounded hover:bg-white/5 disabled opacity-50 italic">I</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] text-gray-500 font-mono">{documentBody.length} chars</span>
                            {activeModel && (
                                <span className="text-[10px] text-green-400 font-mono flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    {activeModel.name.split('/').pop()}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <SimpleMdeReact
                            value={documentBody}
                            onChange={setDocumentBody}
                            options={{
                                toolbar: false,
                                status: false,
                                spellChecker: false,
                                placeholder: "Type '/' for AI commands...",
                            }}
                        />
                    </div>
                </div>

                {/* AI Command Panel */}
                <div className="w-72 flex flex-col gap-4">
                    <div className="bg-[#18181B] border border-white/10 rounded-xl shadow-xl p-5 flex flex-col gap-3">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-yellow-400" />
                            AI Commands
                        </h3>
                        <p className="text-xs text-gray-500 mb-2">
                            {activeModel ? `Using ${activeModel.name.split('/').pop()}` : 'Load a model to enable AI commands'}
                        </p>
                        <button
                            onClick={() => handleAiCommand('continue')}
                            disabled={isGenerating || !activeModel}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-black/30 hover:bg-blue-600/20 border border-white/5 hover:border-blue-500/30 rounded-lg transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Wand2 className="w-4 h-4 text-blue-400 shrink-0" />
                            <div>
                                <div className="text-sm font-semibold text-gray-200">Continue Writing</div>
                                <div className="text-[10px] text-gray-500">AI continues the document</div>
                            </div>
                            {isGenerating && <Loader2 className="w-4 h-4 animate-spin ml-auto text-blue-400" />}
                        </button>
                        <button
                            onClick={() => handleAiCommand('summarize')}
                            disabled={isGenerating || !activeModel}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-black/30 hover:bg-purple-600/20 border border-white/5 hover:border-purple-500/30 rounded-lg transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Copy className="w-4 h-4 text-purple-400 shrink-0" />
                            <div>
                                <div className="text-sm font-semibold text-gray-200">Summarize</div>
                                <div className="text-[10px] text-gray-500">Generate a TL;DR</div>
                            </div>
                        </button>
                        <button
                            onClick={() => handleAiCommand('draft')}
                            disabled={isGenerating || !activeModel}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-black/30 hover:bg-green-600/20 border border-white/5 hover:border-green-500/30 rounded-lg transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Languages className="w-4 h-4 text-green-400 shrink-0" />
                            <div>
                                <div className="text-sm font-semibold text-gray-200">Draft Introduction</div>
                                <div className="text-[10px] text-gray-500">Generate a new section</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
