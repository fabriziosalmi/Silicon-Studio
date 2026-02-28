import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

interface SystemStats {
    ramUsageGB: number;
    ramTotalGB: number;
    vramUsageGB: number;
    vramTotalGB: number;
}

interface LoadedModel {
    id: string;
    name: string;
    size: string;
    path: string;
    architecture?: string;
    context_window?: number;
}

interface GlobalStateContextType {
    backendReady: boolean;
    setBackendReady: (ready: boolean) => void;
    systemStats: SystemStats | null;
    activeModel: LoadedModel | null;
    setActiveModel: (model: LoadedModel | null) => void;
    isTraining: boolean;
    setIsTraining: (training: boolean) => void;
}

const GlobalStateContext = createContext<GlobalStateContextType | undefined>(undefined);

export function GlobalStateProvider({ children }: { children: React.ReactNode }) {
    const [backendReady, setBackendReady] = useState(false);
    const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
    const [activeModel, setActiveModel] = useState<LoadedModel | null>(null);
    const [isTraining, setIsTraining] = useState(false);

    const { isConnected, lastMessage } = useWebSocket('ws://127.0.0.1:8000/ws');

    useEffect(() => {
        setBackendReady(isConnected);
    }, [isConnected]);

    useEffect(() => {
        if (lastMessage) {
            if (lastMessage.type === 'system_stats') {
                setSystemStats(lastMessage.payload);
            } else if (lastMessage.type === 'training_status') {
                setIsTraining(lastMessage.payload.is_training);
            }
        }
    }, [lastMessage]);

    // Fallback Mock for Demo explicitly added since backend WS is not implemented yet
    useEffect(() => {
        if (isConnected) return; // Don't mock if we actually connect

        // Mocking Apple Silicon Unified Memory stats
        const interval = setInterval(() => {
            setSystemStats({
                ramUsageGB: 4.2 + Math.random() * 0.5,
                ramTotalGB: 16,
                vramUsageGB: activeModel ? 2.5 + Math.random() * 0.2 : 0.5 + Math.random() * 0.1,
                vramTotalGB: 16,
            });
            setBackendReady(true); // Mock backend ready for demo purposes
        }, 2000);

        return () => clearInterval(interval);
    }, [isConnected, activeModel]);

    return (
        <GlobalStateContext.Provider value={{
            backendReady,
            setBackendReady,
            systemStats,
            activeModel,
            setActiveModel,
            isTraining,
            setIsTraining
        }}>
            {children}
        </GlobalStateContext.Provider>
    );
}

export function useGlobalState() {
    const context = useContext(GlobalStateContext);
    if (context === undefined) {
        throw new Error('useGlobalState must be used within a GlobalStateProvider');
    }
    return context;
}
