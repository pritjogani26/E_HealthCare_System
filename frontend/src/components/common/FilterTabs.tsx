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
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id
                            ? "bg-slate-900 text-white"
                            : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                        }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};
