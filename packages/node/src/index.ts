export interface VisionOptions {
  projectId: string;
  host?: string;
}

export type SigmaOptions = VisionOptions;

export class VisionAnalytics {
  private projectId: string;
  private host: string;

  constructor(options: VisionOptions) {
    this.projectId = options.projectId;
    this.host = (options.host || 'https://api.visionanalytics.com').replace(/\/$/, '');
  }
}

export const SigmaAnalytics = VisionAnalytics;
