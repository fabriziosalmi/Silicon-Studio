import { useGlobalState } from '../context/GlobalState';
import { Cpu, Activity, DatabaseZap, LogOut } from 'lucide-react';

export function TopBar() {
    const { backendReady, systemStats, activeModel, setActiveModel, isTraining } = useGlobalState();

    return (
        <div className="h-10 w-full drag-region bg-[#18181B]/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 z-50">

            {/* Left: Window Title Placeholder */}
            <div className="flex items-center space-x-2 pl-[80px]">
                {/* pl-[80px] clears mac OS window traffic light buttons perfectly */}
                <span className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">Silicon Studio</span>
            </div>

            {/* Center/Right: Status Indicators */}
            <div className="no-drag flex items-center space-x-6">

                {/* Backend Status */}
                <div className="flex items-center space-x-2 h-full">
                    <div className="relative flex items-center justify-center">
                        <div className={`w-1.5 h-1.5 rounded-full ${backendReady ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]'}`}></div>
                        {backendReady && <div className="absolute w-1.5 h-1.5 rounded-full bg-green-500 animate-ping opacity-75"></div>}
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        {backendReady ? 'Engine Ready' : 'Starting...'}
                    </span>
                </div>

                <div className="h-4 w-px bg-white/10" />

                {/* Active Model */}
                {activeModel ? (
                    <div className="flex items-center space-x-2 bg-blue-500/10 h-7 px-2.5 rounded border border-blue-500/20 shadow-sm">
                        <DatabaseZap size={13} className="text-blue-400" />
                        <span className="text-[11px] font-bold tracking-wide uppercase text-blue-300">{activeModel.name}</span>
                        <div className="w-px h-3.5 bg-blue-500/20 mx-1"></div>
                        <button
                            onClick={() => setActiveModel(null)}
                            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Eject model from VRAM"
                        >
                            <LogOut size={11} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Eject</span>
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center space-x-2 h-7 px-2.5 border border-transparent">
                        <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">No Model Loaded</span>
                    </div>
                )}

                <div className="h-4 w-px bg-white/10" />

                {/* System Stats (RAM/VRAM) */}
                {systemStats ? (
                    <div className="flex items-center space-x-4">
                        {/* Unified Memory (RAM) */}
                        <div className="flex items-center gap-2 group transition-all" title="System RAM Usage">
                            <Cpu size={14} className="text-gray-500 group-hover:text-blue-400 transition-colors" />
                            <div className="flex items-baseline gap-1">
                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">RAM</span>
                                <span className="text-xs text-gray-300 font-mono font-medium">
                                    {(systemStats.ramUsageGB).toFixed(1)}<span className="text-[10px] opacity-50">GB</span>
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 group transition-all" title="MLX VRAM Usage">
                            <Activity size={14} className={activeModel ? "text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.4)]" : "text-gray-500 group-hover:text-purple-400 transition-colors"} />
                            <div className="flex items-baseline gap-1">
                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">VRAM</span>
                                <span className="text-xs text-gray-300 font-mono font-medium">
                                    {(systemStats.vramUsageGB).toFixed(1)}<span className="text-[10px] opacity-50">GB</span>
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <span className="text-xs text-gray-600 font-mono">Loading Stats...</span>
                )}

                {/* Global Task Indicator (Training) */}
                {isTraining && (
                    <>
                        <div className="h-4 w-px bg-white/10" />
                        <div className="flex items-center space-x-1.5">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-blue-400 font-medium">Training Active</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
