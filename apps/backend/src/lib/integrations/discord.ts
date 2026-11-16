
export function sendDiscordNotification({
  webhookUrl,
  message,
}: {
  webhookUrl: string;
  message: string;
}) {
  return fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: message,
      avatar_url: 'https://vision.dev/logo.jpg',
      username: 'Vision Notifications',
    }),
  }).catch(err => {
    return {
      ok: false,
      json: () => Promise.resolve({}),
    };
  });
}

export function sendTestDiscordNotification(webhookUrl: string) {
  return sendDiscordNotification({
    webhookUrl,
    message:
      '**🧪 Test [Vision.dev](<https://vision.dev/>)**\nIf you can read this, your Discord webhook is functioning correctly!\n',
  });
}
