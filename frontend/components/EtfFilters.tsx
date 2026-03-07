"use client";

import { useState, useEffect } from "react";

export interface FilterState {
  q: string;
  provider: string;
  asset_class: string;
  risk_rating: string;
  min_mer: string;
  max_mer: string;
  min_yield: string;
  max_yield: string;
}

const initialState: FilterState = {
  q: "",
  provider: "",
  asset_class: "",
  risk_rating: "",
  min_mer: "",
  max_mer: "",
  min_yield: "",
  max_yield: ""
};

export function EtfFilters({
  onChange
}: {
  onChange: (filters: FilterState) => void;
}) {
  const [state, setState] = useState<FilterState>(initialState);

  useEffect(() => {
    onChange(state);
  }, [state, onChange]);

  const handleChange =
    (key: keyof FilterState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setState((prev) => ({ ...prev, [key]: e.target.value }));
    };
  return (
    <div className="card mb-4 p-4">
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center">
        <input
          className="input md:flex-1"
          placeholder="Search by name or ticker"
          value={state.q}
          onChange={handleChange("q")}
        />
        <div className="flex gap-2 text-xs text-content-secondary">
          <span>Filter by provider, asset class, MER, yield, and risk.</span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-content-secondary">Provider</label>
          <input
            className="input"
            placeholder="e.g. Vanguard"
            value={state.provider}
            onChange={handleChange("provider")}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-content-secondary">Asset class</label>
          <input
            className="input"
            placeholder="Equity, Fixed Income..."
            value={state.asset_class}
            onChange={handleChange("asset_class")}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-content-secondary">Risk rating</label>
          <input
            className="input"
            placeholder="Low, Medium..."
            value={state.risk_rating}
            onChange={handleChange("risk_rating")}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">MER range (%)</label>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="Min"
              value={state.min_mer}
              onChange={handleChange("min_mer")}
            />
            <input
              className="input"
              placeholder="Max"
              value={state.max_mer}
              onChange={handleChange("max_mer")}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-content-secondary">Yield range (%)</label>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="Min"
              value={state.min_yield}
              onChange={handleChange("min_yield")}
            />
            <input
              className="input"
              placeholder="Max"
              value={state.max_yield}
              onChange={handleChange("max_yield")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

