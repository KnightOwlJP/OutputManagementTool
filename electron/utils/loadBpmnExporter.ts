import path from 'path';
import { app } from 'electron';

// Helper to load the compiled BPMN XML exporter in both dev and packaged builds.
export function loadBpmnExporter(): { exportProcessTableToBpmnXml: (...args: any[]) => any } {
  const appPath = app.getAppPath();

  const candidates = [
    // Compiled output from electron/tsconfig.bpmn-exporter.json
    path.join(appPath, 'electron', 'compiled', 'bpmn-xml-exporter.js'),
    // Compiled with preserved folder structure (lib/)
    path.join(appPath, 'electron', 'compiled', 'lib', 'bpmn-xml-exporter.js'),
    // Fallback for scenarios where compiled assets are flattened
    path.join(appPath, 'compiled', 'bpmn-xml-exporter.js'),
    path.join(appPath, 'compiled', 'lib', 'bpmn-xml-exporter.js'),
    // Relative to this file (useful in dev when running without packaging)
    path.join(__dirname, '../compiled/bpmn-xml-exporter.js'),
    path.join(__dirname, '../compiled/lib/bpmn-xml-exporter.js'),
  ];

  for (const candidate of candidates) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require(candidate);
    } catch (error: any) {
      // Ignore and try next
      if (process.env.DEBUG_BPMN_EXPORTER_RESOLVE) {
        console.warn('[BPMN Exporter] Failed to load candidate', candidate, error?.message);
      }
    }
  }

  // Dev fallback: load TS source via ts-node (ts-node is a devDependency)
  const tsSource = path.join(appPath, 'src', 'lib', 'bpmn-xml-exporter.ts');
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('ts-node/register/transpile-only');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(tsSource);
  } catch (error: any) {
    throw new Error(
      `Could not load BPMN exporter. Tried candidates: ${candidates.join(', ')}; TS fallback: ${tsSource}; error: ${error?.message}`
    );
  }
}
