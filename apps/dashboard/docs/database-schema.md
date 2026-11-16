# Database Schema

Umami relies on a relational schema managed by Prisma. Below is a breakdown of the primary entities and their roles within the system.

## Core Tables

- **User**: Represents platform users who can log in, create projects, and view analytics.
- **Organization & Member**: Allows users to group themselves and share access to specific projects and projects.
- **Project**: A tracked domain. Associated with either a `User` or a `Organization`. It generates a unique tracking ID (`projectId`).

## Analytics Tables

When operating without ClickHouse, the following tables in PostgreSQL hold all incoming analytics traffic:

- **Session**: Represents a unique visitor. Sessions are derived probabilistically (IP + User Agent + Salt) or deterministically if a distinct ID is provided via the `identify` method. It protects user privacy by avoiding persistent cookies.
- **ProjectEvent**: Represents an action taken by a session. Can be a `pageView`, `customEvent`, `linkEvent`, or `pixelEvent`. Captures URLs, referrers, UTM parameters, and device information.
- **EventData**: Key-value metadata associated with a specific `ProjectEvent` (e.g., custom properties for a checkout event).
- **SessionData**: Key-value metadata associated with a specific `Session` (e.g., user traits like "plan: pro" via the `identify` API).
- **Revenue**: Tracks monetary values associated with specific events (e.g. purchases).

## Application Data Tables

- **Report**: Saved analytics configurations for the dashboard (e.g., Funnels, Journey, Retained users).
- **Segment**: Saved filters that can be applied to dashboard views to isolate specific user segments.
- **Link & Pixel**: Used for tracking specific short links or tracking pixels in emails.
