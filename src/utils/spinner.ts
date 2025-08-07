import ora from 'ora';
import { colors } from './colors.js';

// Enhanced spinner with SentVibe styling
export function spinner(text: string, options?: {
  color?: any;
  spinner?: any;
  prefixText?: string;
}) {
  const oraOptions: any = {
    text: colors.spinner(text),
    prefixText: options?.prefixText ? colors.dim(options.prefixText) : undefined,
  };

  if (options?.color) oraOptions.color = options.color;
  if (options?.spinner) oraOptions.spinner = options.spinner;

  return ora(oraOptions);
}

// Predefined spinners for common operations
export const spinners = {
  // Initialization
  init: (text: string = 'Initializing SentVibe...') => 
    spinner(text, { spinner: 'bouncingBall' }),
  
  // Memory operations
  memory: (text: string = 'Processing memory...') => 
    spinner(text, { spinner: 'dots12' }),
  
  // Sandbox operations
  sandbox: (text: string = 'Running in sandbox...') => 
    spinner(text, { spinner: 'arrow3' }),
  
  // File operations
  files: (text: string = 'Processing files...') => 
    spinner(text, { spinner: 'line' }),
  
  // AI operations
  ai: (text: string = 'Detecting AI agents...') => 
    spinner(text, { spinner: 'star' }),
  
  // Testing
  test: (text: string = 'Running tests...') => 
    spinner(text, { spinner: 'clock' }),
  
  // Building/compilation
  build: (text: string = 'Building...') => 
    spinner(text, { spinner: 'hamburger' }),
  
  // Network operations
  network: (text: string = 'Connecting...') => 
    spinner(text, { spinner: 'earth' }),
  
  // Generic loading
  loading: (text: string = 'Loading...') => 
    spinner(text, { spinner: 'dots' }),
};

// Utility function for timed operations
export async function withSpinner<T>(
  operation: () => Promise<T>,
  text: string,
  options?: {
    successText?: string;
    errorText?: string;
    spinnerType?: keyof typeof spinners;
  }
): Promise<T> {
  const spinnerInstance = options?.spinnerType 
    ? spinners[options.spinnerType](text)
    : spinner(text);
  
  spinnerInstance.start();
  
  try {
    const result = await operation();
    spinnerInstance.succeed(
      options?.successText || text.replace(/\.\.\.$/, ' completed')
    );
    return result;
  } catch (error) {
    spinnerInstance.fail(
      options?.errorText || text.replace(/\.\.\.$/, ' failed')
    );
    throw error;
  }
}

// Progress spinner for operations with steps
export class ProgressSpinner {
  private spinner: ReturnType<typeof ora>;
  private currentStep: number = 0;
  private totalSteps: number;
  private steps: string[];

  constructor(steps: string[], initialText?: string) {
    this.steps = steps;
    this.totalSteps = steps.length;
    this.spinner = ora({
      text: initialText || this.getStepText(),
      color: 'cyan',
      spinner: 'dots',
    });
  }

  private getStepText(): string {
    const progress = `[${this.currentStep}/${this.totalSteps}]`;
    const step = this.steps[this.currentStep] || 'Completed';
    return colors.dim(progress) + ' ' + colors.spinner(step);
  }

  start(): void {
    this.spinner.start();
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps - 1) {
      this.currentStep++;
      this.spinner.text = this.getStepText();
    }
  }

  succeed(text?: string): void {
    this.spinner.succeed(text || 'All steps completed successfully');
  }

  fail(text?: string): void {
    this.spinner.fail(text || `Failed at step ${this.currentStep + 1}`);
  }

  stop(): void {
    this.spinner.stop();
  }
}

export default spinner;
