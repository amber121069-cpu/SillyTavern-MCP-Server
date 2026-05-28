import { Router } from 'express';
import { MCP_SETTINGS_FILE, mcpInit, readMcpSettings } from './mcp';
import { Request } from './types';
import path from 'node:path';
import { execFile } from 'child_process';

const ID = 'mcp';

async function init(router: Router): Promise<void> {
  mcpInit(router);
  // @ts-ignore
  router.post('/open-settings', (request: Request, response) => {
    // Make sure file is exist
    readMcpSettings(request.user.directories);

    // Open in explorer
    const platform = process.platform;
    const filePath = path.join(request.user.directories.root, MCP_SETTINGS_FILE);

    // [pin] §4.B: exec → execFile with args array to eliminate shell-injection shape
    // (bmen MCP audit 2026-05-27)
    let command: string;
    let args: string[];
    switch (platform) {
      case 'darwin': // macOS
        command = 'open';
        args = ['-R', filePath];
        break;
      case 'win32': // Windows
        command = 'explorer';
        args = [`/select,${filePath}`];
        break;
      default: // Linux and others
        command = 'xdg-open';
        args = [filePath.replace(/[^/]*$/, '')];
        break;
    }

    execFile(command, args, (_error: Error | null) => {
      response.send({});
    });
  });
}

interface PluginInfo {
  id: string;
  name: string;
  description: string;
}

export default {
  init,
  exit: (): void => {},
  info: {
    id: ID,
    name: 'MCP Server',
    description: 'Allows you to connect to an MCP server and execute tools',
  } as PluginInfo,
};
