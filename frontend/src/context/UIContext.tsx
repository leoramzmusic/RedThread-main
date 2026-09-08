import React, { createContext, useContext, useState, useEffect } from 'react';

interface UIContextType {
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
    drawerWidth: number;
    DRAWER_WIDTH: number;
    DRAWER_WIDTH_COLLAPSED: number;
}

const DRAWER_WIDTH = 260;
const DRAWER_WIDTH_COLLAPSED = 72;

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Initialize from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('sidebar_collapsed');
        if (saved !== null) {
            setSidebarCollapsed(saved === 'true');
        }
    }, []);

    // Persist to localStorage
    const handleSetSidebarCollapsed = (collapsed: boolean) => {
        setSidebarCollapsed(collapsed);
        localStorage.setItem('sidebar_collapsed', String(collapsed));
    };

    const drawerWidth = sidebarCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;

    return (
        <UIContext.Provider value={{
            sidebarCollapsed,
            setSidebarCollapsed: handleSetSidebarCollapsed,
            drawerWidth,
            DRAWER_WIDTH,
            DRAWER_WIDTH_COLLAPSED
        }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
