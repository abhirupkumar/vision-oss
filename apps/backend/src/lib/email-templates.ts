/**
 * HTML email templates for Vision Analytics notifications.
 */

export function buildEventNotificationEmail(params: {
  projectName: string;
  eventName: string;
  payload: any;
  ruleName: string;
}): { subject: string; html: string } {
  const { projectName, eventName, ruleName } = params;
  const subject = `[Vision] Event Notification: ${eventName} on ${projectName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f5f7; color: #172b4d; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; }
    .title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0; }
    .badge { display: inline-block; background: #e0e7ff; color: #3730a3; font-size: 12px; font-weight: 600; padding: 4px 8px; border-radius: 4px; margin-top: 8px; }
    .content { font-size: 15px; line-height: 1.6; color: #334155; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">🔔 Event Notification</h1>
      <span class="badge">Rule: ${ruleName}</span>
    </div>
    <div class="content">
      <p>A new event matched your notification rule on project <strong>${projectName}</strong>:</p>
      <div style="background: #f8fafc; border-left: 4px solid #6366f1; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
        <strong style="font-size: 16px;">${eventName}</strong>
      </div>
    </div>
    <div class="footer">
      Sent by Vision Analytics Notification Engine
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, html };
}

export function buildAnomalyNotificationEmail(params: {
  projectName: string;
  signals: Array<{ label: string; current: number; baseline: number; deltaPercent: number; severity: string }>;
}): { subject: string; html: string } {
  const { projectName, signals } = params;
  const count = signals.length;
  const subject = `[Vision Alert] ${count} Anomaly${count > 1 ? 'ies' : ''} Detected on ${projectName}`;

  const rows = signals.map(s => {
    const isUp = s.deltaPercent > 0;
    const color = s.severity === 'critical' ? '#ef4444' : s.severity === 'warning' ? '#f59e0b' : '#3b82f6';
    return `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px; font-weight: 600; color: ${color};">${s.label}</td>
        <td style="padding: 12px;">${s.current}</td>
        <td style="padding: 12px;">${s.baseline}</td>
        <td style="padding: 12px; font-weight: 700; color: ${isUp ? '#10b981' : '#ef4444'};">${isUp ? '+' : ''}${s.deltaPercent.toFixed(1)}%</td>
        <td style="padding: 12px;"><span style="text-transform: uppercase; font-size: 11px; padding: 2px 6px; border-radius: 3px; background: ${color}20; color: ${color}; font-weight: 700;">${s.severity}</span></td>
      </tr>
    `;
  }).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f5f7; color: #172b4d; padding: 20px; }
    .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .header { border-bottom: 2px solid #ef4444; padding-bottom: 16px; margin-bottom: 24px; }
    .title { font-size: 20px; font-weight: 700; color: #991b1b; margin: 0; }
    .table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
    .th { text-align: left; background: #f8fafc; padding: 10px 12px; font-size: 12px; color: #64748b; text-transform: uppercase; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">⚠️ Anomaly Alert</h1>
    </div>
    <div class="content">
      <p>Vision's detection engine identified statistical anomalies for <strong>${projectName}</strong>:</p>
      <table class="table">
        <thead>
          <tr>
            <th class="th">Metric</th>
            <th class="th">Current</th>
            <th class="th">Baseline</th>
            <th class="th">Change</th>
            <th class="th">Severity</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
    <div class="footer">
      Sent by Vision Analytics Anomaly Detection Engine
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, html };
}
