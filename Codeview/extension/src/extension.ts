import * as vscode from 'vscode'
import { startServer, stopServer } from './server'

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('codesight.start', async () => {
      const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
      if (!workspacePath) {
        vscode.window.showErrorMessage('CodeSight: No workspace folder open.')
        return
      }
      await startServer(workspacePath)
      vscode.window.showInformationMessage(
        'CodeSight: Server running on http://localhost:3001',
        'Open Visualizer'
      ).then(choice => {
        if (choice === 'Open Visualizer') {
          vscode.env.openExternal(vscode.Uri.parse('http://localhost:5173'))
        }
      })
    }),
    vscode.commands.registerCommand('codesight.stop', () => {
      stopServer()
      vscode.window.showInformationMessage('CodeSight: Server stopped.')
    })
  )
}

export function deactivate() {
  stopServer()
}
