# A/B Testing in Vision Analytics

Vision provides built-in A/B testing to help you run experiments, compare variants, and measure conversion rates directly from your analytics dashboard.

---

## How It Works

1. **Create a test** — Define your experiment name, a goal event, and 2+ variants with relative weights.
2. **Start the test** — Change status from Draft → Running.
3. **Integrate the tracker** — Use the `window.vision.abTest()` SDK method to assign visitors to variants.
4. **Track conversions** — Call `window.vision.abConvert()` when the goal event occurs.
5. **Analyze results** — View per-variant session counts, conversion counts, and conversion rates in the dashboard.
6. **Stop the test** — When you have a winner, stop the test.

---

## Managing Tests in the Dashboard

Navigate to **Your Project → A/B Tests** in the sidebar.

### Create a Test
- Click **New Test**
- Enter a **Test Name** (e.g. "Homepage Hero CTA")
- Enter the **Goal Event Name** — the event tracked when a user converts (e.g. `signup`, `purchase`)
- Add **Variants** with names and relative weights (e.g. Control: 50, Variant A: 50 for a 50/50 split)
- Click **Create Test**

### Lifecycle
| Status | Description |
|---|---|
| `draft` | Created but not yet running. No sessions are counted. |
| `running` | Active. Visitors are being assigned and tracked. |
| `stopped` | Ended. No new sessions are assigned. Results are final. |

Click the ▶ **Play** button to start, and the ■ **Stop** button to end a test.

---

## Tracker Integration

Add the Vision tracker script to your page as normal, then use the A/B testing API:

### `vision.abTest(testId, variants)` — Assign a variant

Call this when the page loads. Returns the assigned variant (sticky across page loads via `localStorage`).

```html
<script async data-project-id="YOUR_PROJECT_ID" src="/script.js"></script>
<script>
  window.vision = window.vision || {};

  // Define your test ID (from the dashboard URL) and variant list
  const TEST_ID = 'YOUR_TEST_ID_FROM_DASHBOARD';
  const variants = [
    { id: 'VARIANT_A_ID', name: 'Control', weight: 50 },
    { id: 'VARIANT_B_ID', name: 'New CTA',  weight: 50 },
  ];

  // Wait for tracker to load, then assign the variant
  document.querySelector('[data-project-id]').addEventListener('load', async () => {
    const variant = await window.vision.abTest(TEST_ID, variants);
    console.log('Assigned variant:', variant.name);

    // Apply your variant logic here
    if (variant.name === 'New CTA') {
      document.querySelector('#hero-cta').textContent = 'Start Free Trial';
    }
  });
</script>
```

> **Note**: The `variant.id` values come from the Variant IDs shown in the A/B Test detail view in the dashboard.

### `vision.abConvert(testId)` — Track a conversion

Call this when the user completes the goal action. This marks the session as converted.

```javascript
// Example: track conversion when a button is clicked
document.querySelector('#signup-button').addEventListener('click', () => {
  window.vision.abConvert('YOUR_TEST_ID_FROM_DASHBOARD');
  // Also track the underlying goal event
  window.vision.track('signup');
});
```

---

## Understanding Results

In the A/B Test detail view you'll see a table per variant:

| Column | Description |
|---|---|
| **Sessions** | Unique visitors assigned to this variant |
| **Conversions** | Sessions that triggered the goal event |
| **Conversion Rate** | `conversions / sessions × 100%` |

The variant with the highest conversion rate is highlighted with a 🏆 trophy icon.

---

## Important Notes

- **Sticky assignment**: Variant assignment is stored in `localStorage`. A user will always see the same variant across multiple visits on the same device/browser.
- **The tracker must fire first**: `vision.abTest()` requires an active session (i.e., at least one page view has been tracked). Call it after the tracker initializes.
- **Test IDs and Variant IDs**: Copy these from the dashboard URL and variant detail table — they are UUIDs.
- **Running tests only**: Sessions are tracked only when the test status is `running`. Starting a test does not retroactively count previous sessions.
