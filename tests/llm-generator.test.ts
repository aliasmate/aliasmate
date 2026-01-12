import { describe, it, expect } from '@jest/globals';
import { generateLLMContent, getDefaultLLMCommand } from '../src/utils/llm-generator';

describe('LLM generator', () => {
  describe('generateLLMContent', () => {
    it('should generate comprehensive documentation', () => {
      const content = generateLLMContent();

      expect(content).toContain('AliasMate');
      expect(content).toContain('Version: 1.3.1');
      expect(content.length).toBeGreaterThan(1000); // Should be substantial
    });

    it('should include all command documentation', () => {
      const content = generateLLMContent();

      expect(content).toContain('aliasmate prev');
      expect(content).toContain('aliasmate run');
      expect(content).toContain('aliasmate save');
      expect(content).toContain('aliasmate list');
      expect(content).toContain('aliasmate edit');
      expect(content).toContain('aliasmate delete');
      expect(content).toContain('aliasmate export');
      expect(content).toContain('aliasmate import');
      expect(content).toContain('aliasmate search');
    });

    it('should include path mode documentation', () => {
      const content = generateLLMContent();

      expect(content).toContain('Path Mode Feature');
      expect(content).toContain('Saved Directory Mode');
      expect(content).toContain('Current Directory Mode');
      expect(content).toContain('pathMode');
    });

    it('should include best practices section', () => {
      const content = generateLLMContent();

      expect(content).toContain('Best Practices');
      expect(content).toContain('Descriptive Names');
      expect(content).toContain('Path Mode Selection');
    });

    it('should include example workflows', () => {
      const content = generateLLMContent();

      expect(content).toContain('Example Workflows');
      expect(content).toContain('Frontend Development');
      expect(content).toContain('Backend API');
      expect(content).toContain('DevOps');
    });

    it('should include troubleshooting guide', () => {
      const content = generateLLMContent();

      expect(content).toContain('Troubleshooting');
      expect(content).toContain('Command Not Found');
      expect(content).toContain('Directory Not Found');
    });

    it('should include AI assistant integration tips', () => {
      const content = generateLLMContent();

      expect(content).toContain('Integration with AI Assistants');
      expect(content).toContain('AI for help');
    });
  });

  describe('getDefaultLLMCommand', () => {
    it('should return command with correct name', () => {
      const cmd = getDefaultLLMCommand();

      expect(cmd.name).toBe('llm');
    });

    it('should use current path mode', () => {
      const cmd = getDefaultLLMCommand();

      expect(cmd.pathMode).toBe('current');
    });

    it('should generate shell command to create file', () => {
      const cmd = getDefaultLLMCommand();

      expect(cmd.command).toContain('cat >');
      expect(cmd.command).toContain('llm.txt');
      expect(cmd.command).toContain('ALIASMATE_LLM_EOF');
    });

    it('should include success message in command', () => {
      const cmd = getDefaultLLMCommand();

      expect(cmd.command).toContain('echo');
      expect(cmd.command).toContain('Created llm.txt');
    });

    it('should embed full documentation in command', () => {
      const cmd = getDefaultLLMCommand();

      // Command should contain embedded documentation
      expect(cmd.command).toContain('AliasMate');
      expect(cmd.command).toContain('Path Mode Feature');
      expect(cmd.command).toContain('Best Practices');
    });

    it('should use current working directory as base', () => {
      const cmd = getDefaultLLMCommand();

      expect(cmd.directory).toBe(process.cwd());
    });
  });

  describe('LLM content structure', () => {
    it('should have proper markdown formatting', () => {
      const content = generateLLMContent();

      // Check for markdown headers
      expect(content).toMatch(/^#\s+/m);
      expect(content).toMatch(/^##\s+/m);
      expect(content).toMatch(/^###\s+/m);
    });

    it('should include code blocks', () => {
      const content = generateLLMContent();

      expect(content).toContain('```bash');
      expect(content).toContain('```');
    });

    it('should include bullet lists', () => {
      const content = generateLLMContent();

      expect(content).toMatch(/^-\s+/m);
    });

    it('should be properly formatted for AI consumption', () => {
      const content = generateLLMContent();

      // Should have clear sections
      expect(content).toContain('## Overview');
      expect(content).toContain('## Core Capabilities');
      expect(content).toContain('## Available Commands');
      expect(content).toContain('## Configuration');
      expect(content).toContain('## Use Cases');
    });
  });

  describe('content completeness', () => {
    it('should include all core capabilities', () => {
      const content = generateLLMContent();

      expect(content).toContain('Command Storage');
      expect(content).toContain('Command Execution');
      expect(content).toContain('Command Management');
    });

    it('should document configuration details', () => {
      const content = generateLLMContent();

      expect(content).toContain('~/.config/aliasmate/config.json');
      expect(content).toContain('Command Alias Structure');
      expect(content).toContain('createdAt');
      expect(content).toContain('updatedAt');
    });

    it('should include technical details', () => {
      const content = generateLLMContent();

      expect(content).toContain('TypeScript');
      expect(content).toContain('Node.js');
      expect(content).toContain('Cross-platform');
    });

    it('should have proper footer with version', () => {
      const content = generateLLMContent();

      expect(content).toContain('Generated by AliasMate v1.3.1');
      expect(content).toContain('github.com/aliasmate/aliasmate');
    });
  });
});
