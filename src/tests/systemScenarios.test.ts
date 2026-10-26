import { describe, it, expect } from 'vitest';
import { SCENARIO_DEFINITIONS } from '../scenarios/scenarioDefinitions';

describe('Smart Emergency Response & Hospital Routing - System Scenarios', () => {
  SCENARIO_DEFINITIONS.forEach((scenario) => {
    it(`[${scenario.id}] ${scenario.name}`, () => {
      const result = scenario.run();
      if (result.status !== 'passed') {
        console.error(`Scenario failed: ${result.name}`, result.logs, result.details);
      }
      expect(result.status).toBe('passed');
    });
  });
});
