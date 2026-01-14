import { describe, it, expect } from '@jest/globals';
import { type TextInputPrompt, type ConfirmPrompt, type ListPrompt } from '../src/utils/prompts';

describe('prompts', () => {
  describe('Type definitions', () => {
    it('should accept valid TextInputPrompt', () => {
      const prompt: TextInputPrompt = {
        type: 'input',
        name: 'test',
        message: 'Test message',
      };

      expect(prompt.type).toBe('input');
      expect(prompt.name).toBe('test');
      expect(prompt.message).toBe('Test message');
    });

    it('should accept TextInputPrompt with optional fields', () => {
      const prompt: TextInputPrompt = {
        type: 'input',
        name: 'test',
        message: 'Test message',
        default: 'default value',
        validate: (input: string) => input.length > 0 || 'Required',
      };

      expect(prompt.default).toBe('default value');
      expect(prompt.validate).toBeDefined();
    });

    it('should accept valid ConfirmPrompt', () => {
      const prompt: ConfirmPrompt = {
        type: 'confirm',
        name: 'test',
        message: 'Confirm?',
        default: true,
      };

      expect(prompt.type).toBe('confirm');
      expect(prompt.default).toBe(true);
    });

    it('should accept valid ListPrompt', () => {
      const prompt: ListPrompt = {
        type: 'list',
        name: 'test',
        message: 'Choose',
        choices: [
          { name: 'Option 1', value: 'opt1' },
          { name: 'Option 2', value: 'opt2' },
        ],
      };

      expect(prompt.type).toBe('list');
      expect(prompt.choices).toHaveLength(2);
    });
  });

  describe('Validation functions', () => {
    it('should support validation in TextInputPrompt', () => {
      const validateFn = (input: string) => input.trim().length > 0 || 'Cannot be empty';

      const prompt: TextInputPrompt = {
        type: 'input',
        name: 'test',
        message: 'Enter value',
        validate: validateFn,
      };

      expect(prompt.validate?.('test')).toBe(true);
      expect(prompt.validate?.('')).toBe('Cannot be empty');
      expect(prompt.validate?.('   ')).toBe('Cannot be empty');
    });

    it('should support complex validation', () => {
      const validateFn = (input: string) => {
        if (!input.trim()) return 'Required';
        if (input.includes(' ')) return 'No spaces allowed';
        if (!/^[a-z0-9-]+$/.test(input)) return 'Invalid characters';
        return true;
      };

      const prompt: TextInputPrompt = {
        type: 'input',
        name: 'name',
        message: 'Enter name',
        validate: validateFn,
      };

      expect(prompt.validate?.('valid-name')).toBe(true);
      expect(prompt.validate?.('')).toBe('Required');
      expect(prompt.validate?.('has space')).toBe('No spaces allowed');
      expect(prompt.validate?.('Invalid!')).toBe('Invalid characters');
    });
  });

  describe('Prompt type safety', () => {
    it('should ensure type safety for text prompts', () => {
      const prompt: TextInputPrompt = {
        type: 'input',
        name: 'username',
        message: 'Enter username',
      };

      // Type should be exactly 'input'
      const typeCheck: 'input' = prompt.type;
      expect(typeCheck).toBe('input');
    });

    it('should ensure type safety for confirm prompts', () => {
      const prompt: ConfirmPrompt = {
        type: 'confirm',
        name: 'proceed',
        message: 'Continue?',
      };

      // Type should be exactly 'confirm'
      const typeCheck: 'confirm' = prompt.type;
      expect(typeCheck).toBe('confirm');
    });

    it('should ensure type safety for list prompts', () => {
      const prompt: ListPrompt = {
        type: 'list',
        name: 'action',
        message: 'Select action',
        choices: [{ name: 'Action', value: 'action' }],
      };

      // Type should be exactly 'list'
      const typeCheck: 'list' = prompt.type;
      expect(typeCheck).toBe('list');
    });
  });

  describe('Prompt structure', () => {
    it('should validate TextInputPrompt structure', () => {
      const prompt: TextInputPrompt = {
        type: 'input',
        name: 'field',
        message: 'Enter value',
        default: 'default',
      };

      expect(Object.keys(prompt)).toContain('type');
      expect(Object.keys(prompt)).toContain('name');
      expect(Object.keys(prompt)).toContain('message');
    });

    it('should validate choices structure in ListPrompt', () => {
      const choices = [
        { name: 'First', value: 'first' },
        { name: 'Second', value: 'second' },
      ];

      const prompt: ListPrompt = {
        type: 'list',
        name: 'choice',
        message: 'Select',
        choices,
      };

      expect(prompt.choices).toEqual(choices);
      expect(prompt.choices[0]).toHaveProperty('name');
      expect(prompt.choices[0]).toHaveProperty('value');
    });
  });
});
