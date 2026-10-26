import React, { useState } from 'react';
import {
  SCENARIO_DEFINITIONS,
  ScenarioResult,
  runAllScenarios,
} from '../../scenarios/scenarioDefinitions';
import {
  CheckSquare,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  FileText,
} from 'lucide-react';

export const ScenariosTab: React.FC = () => {
  const [results, setResults] = useState<ScenarioResult[]>(() => runAllScenarios());
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [expandedScenarioId, setExpandedScenarioId] = useState<string | null>(null);

  const handleRunAll = () => {
    const fresh = runAllScenarios();
    setResults(fresh);
  };

  const handleRunSingle = (id: string) => {
    const scenario = SCENARIO_DEFINITIONS.find((s) => s.id === id);
    if (!scenario) return;
    const res = scenario.run();
    setResults((prev) => prev.map((r) => (r.id === id ? res : r)));
  };

  const passedCount = results.filter((r) => r.status === 'passed').length;
  const failedCount = results.filter((r) => r.status === 'failed').length;
  const totalDurationMs = results.reduce((sum, r) => sum + r.executionTimeMs, 0);

  const filteredResults = results.filter((r) => {
    if (filterCategory !== 'all' && r.category !== filterCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-teal-600" />
            <span>Automated System Test Scenarios (14 Test Cases)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Validation suite covering clinical triage constraints, capacity overrides, graph detours, and multi-objective routing
          </p>
        </div>

        <button
          onClick={handleRunAll}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-xs shadow-sm transition"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Execute All 14 Scenarios</span>
        </button>
      </div>

      {/* Summary Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Tests Passed
            </span>
            <span className="text-2xl font-black text-emerald-600">{passedCount} / 14</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Failures
            </span>
            <span
              className={`text-2xl font-black ${
                failedCount > 0 ? 'text-rose-600' : 'text-slate-400'
              }`}
            >
              {failedCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Success Rate
            </span>
            <span className="text-2xl font-black text-blue-600">
              {Math.round((passedCount / 14) * 100)}%
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Suite Execution Time
            </span>
            <span className="text-2xl font-black text-slate-900">{totalDurationMs.toFixed(2)} ms</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs font-semibold text-slate-500">Filter Category:</span>
        {['all', 'clinical_triage', 'routing_graph', 'capacity', 'workflow'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition ${
              filterCategory === cat
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Scenario Results List */}
      <div className="space-y-3">
        {filteredResults.map((scenario) => {
          const isExpanded = expandedScenarioId === scenario.id;
          const isPassed = scenario.status === 'passed';

          return (
            <div
              key={scenario.id}
              className={`bg-white rounded-xl border overflow-hidden shadow-sm transition ${
                isPassed ? 'border-slate-200' : 'border-rose-300 ring-2 ring-rose-200'
              }`}
            >
              {/* Accordion Header Row */}
              <div
                onClick={() => setExpandedScenarioId(isExpanded ? null : scenario.id)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition select-none"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </span>

                  <span className="font-mono text-xs font-bold text-slate-500">
                    {scenario.id}
                  </span>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{scenario.name}</h3>
                    <p className="text-xs text-slate-500">{scenario.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                    {scenario.category.replace('_', ' ')}
                  </span>

                  <span className="text-xs text-slate-400 font-mono">
                    {scenario.executionTimeMs} ms
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      isPassed
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {isPassed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    {isPassed ? 'PASSED' : 'FAILED'}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRunSingle(scenario.id);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200"
                    title="Re-run this scenario"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Accordion Expanded Details */}
              {isExpanded && (
                <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/70 space-y-3 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Expected Outcome
                      </span>
                      <p className="text-slate-800 font-medium">{scenario.expectedOutcome}</p>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Actual Outcome
                      </span>
                      <p className="text-slate-800 font-medium">{scenario.actualOutcome}</p>
                    </div>
                  </div>

                  {/* Execution Trace Logs */}
                  <div className="p-3 bg-slate-900 rounded-lg text-slate-200 font-mono text-[11px] space-y-1 overflow-x-auto">
                    <span className="text-slate-500 font-sans text-[10px] uppercase font-bold block mb-1">
                      Scenario Execution Log Trace:
                    </span>
                    {scenario.logs.map((log, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-slate-600 select-none">&gt;</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
