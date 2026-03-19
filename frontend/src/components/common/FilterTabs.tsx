// frontend\src\components\common\FilterTabs.tsx
import React from "react";

interface Tab {
    id: string;
    label: string;
}

interface FilterTabsProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (id: string) => void;
}

export const FilterTabs: React.FC<FilterTabsProps> = ({ tabs, activeTab, onTabChange }) => {
    return (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
                    style={
                        activeTab === tab.id
                            ? {
                                backgroundColor: "#1a3c6e",
                                color: "#ffffff",
                                border: "1px solid #1a3c6e",
                              }
                            : {
                                backgroundColor: "#ffffff",
                                color: "#555555",
                                border: "1px solid #d0dff0",
                              }
                    }
                    onMouseEnter={(e) => {
                        if (activeTab !== tab.id) {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#e8f0f7";
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (activeTab !== tab.id) {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#ffffff";
                        }
                    }}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};