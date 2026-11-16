import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  customType,
  decimal,
  foreignKey,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// Custom types
const bytea = customType<{ data: Buffer; driverData: string }>({
  dataType() {
    return 'bytea';
  },
  toDriver(val) {
    return '\\x' + val.toString('hex');
  },
  fromDriver(value) {
    if (Buffer.isBuffer(value)) return value;
    if (typeof value === 'string') {
      if (value.startsWith('\\x')) {
        return Buffer.from(value.slice(2), 'hex');
      }
      return Buffer.from(value);
    }
    return Buffer.from([]);
  },
});

export const AccessLevel = pgEnum('AccessLevel', ['read', 'write', 'admin']);

export const ClientType = pgEnum('ClientType', ['read', 'write', 'root']);

export const PaymentProvider = pgEnum('PaymentProvider', [
  'stripe',
  'paddle',
  'polar',
  'lemonsqueezy',
]);

export const PaymentConnectionStatus = pgEnum('PaymentConnectionStatus', [
  'pending',
  'active',
  'failed',
  'disconnected',
]);

export const ABTestStatus = pgEnum('ABTestStatus', ['draft', 'running', 'stopped']);

export const ErrorLevel = pgEnum('ErrorLevel', ['fatal', 'error', 'warning', 'info']);

export const SubscriptionStatus = pgEnum('SubscriptionStatus', [
  'active',
  'trialing',
  'past_due',
  'unpaid',
  'cancelled',
  'inactive',
]);



export const ErrorGroup = pgTable('error_group', {
  id:            text('error_group_id').notNull().primaryKey()
                   .default(sql`gen_random_uuid()::text`),
  projectId:     text('project_id').notNull(),
  fingerprint:   text('fingerprint').notNull(),
  errorType:     text('error_type').notNull(),
  message:       text('message').notNull(),
  occurrences:   integer('occurrences').notNull().default(1),
  affectedUsers: integer('affected_users').notNull().default(0),
  firstSeen:     timestamp('first_seen', { precision: 3 }).defaultNow(),
  lastSeen:      timestamp('last_seen', { precision: 3 }).defaultNow(),
  resolved:      boolean('resolved').notNull().default(false),
  resolvedAt:    timestamp('resolved_at', { precision: 3 }),
  resolvedBy:    text('resolved_by'),
}, t => ({
  error_group_project_fkey: foreignKey({
    name: 'error_group_project_fkey',
    columns: [t.projectId],
    foreignColumns: [Project.id],
  }).onDelete('cascade').onUpdate('cascade'),
  error_group_unique_idx: uniqueIndex('error_group_unique_idx')
    .on(t.projectId, t.fingerprint),
}));

export const User = pgTable('user', {
  id: text('user_id').notNull().primaryKey(),
  clerkId: text('clerk_id').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password'),
  role: text('role').notNull(),
  logoUrl: text('logo_url'),
  displayName: text('display_name'),
  createdAt: timestamp('created_at', { precision: 3 }).defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3 }),
  deletedAt: timestamp('deleted_at', { precision: 3 }),
});



export const Project = pgTable(
  'project',
  {
    id: text('project_id').notNull().primaryKey().default(sql`gen_random_uuid()::text`),
    name: text('name').notNull(),
    domain: text('domain'),
    shareId: text('share_id').unique(),
    resetAt: timestamp('reset_at', { precision: 3 }),
    userId: text('user_id'),
    organizationId: text('organization_id'),
    createdBy: text('created_by'),
    replayEnabled: boolean('replay_enabled').notNull(),
    replayConfig: jsonb('replay_config'),
    autocaptureEnabled: boolean('autocapture_enabled').notNull().default(true),
    createdAt: timestamp('created_at', { precision: 3 }).defaultNow(),
    updatedAt: timestamp('updated_at', { precision: 3 }),
    deletedAt: timestamp('deleted_at', { precision: 3 }),
  },
  Project => ({
    project_user_fkey: foreignKey({
      name: 'project_user_fkey',
      columns: [Project.userId],
      foreignColumns: [User.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    project_createUser_fkey: foreignKey({
      name: 'project_createUser_fkey',
      columns: [Project.createdBy],
      foreignColumns: [User.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    project_organization_fkey: foreignKey({
      name: 'project_organization_fkey',
      columns: [Project.organizationId],
      foreignColumns: [Organization.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);



export const Organization = pgTable('organization', {
  id: text('organization_id').notNull().primaryKey().default(sql`gen_random_uuid()::text`),
  name: text('name').notNull(),
  accessCode: text('access_code').unique(),
  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at', { precision: 3 }).defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3 }),
  deletedAt: timestamp('deleted_at', { precision: 3 }),
});

export const OrganizationSubscription = pgTable(
  'organization_subscription',
  {
    id: text('subscription_id')
      .notNull()
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    organizationId: text('organization_id').notNull().unique(),
    dodoSubscriptionId: text('dodo_subscription_id'),
    dodoCustomerId: text('dodo_customer_id'),
    dodoPaymentId: text('dodo_payment_id'),
    status: SubscriptionStatus('status').notNull().default('inactive'),
    planTier: text('plan_tier').notNull().default('base_39'),
    baseAmount: decimal('base_amount', { precision: 10, scale: 2 })
      .notNull()
      .default('39.00'),
    includedCredit: decimal('included_credit', { precision: 10, scale: 2 })
      .notNull()
      .default('39.00'),
    spendingCap: decimal('spending_cap', { precision: 10, scale: 2 })
      .notNull()
      .default('150.00'),
    pauseOnCap: boolean('pause_on_cap').notNull().default(true),
    isLocked: boolean('is_locked').notNull().default(false),
    lockedReason: text('locked_reason'),
    lockedAt: timestamp('locked_at', { precision: 3 }),
    currentPeriodStart: timestamp('current_period_start', { precision: 3 }),
    currentPeriodEnd: timestamp('current_period_end', { precision: 3 }),
    lastWarningSent: text('last_warning_sent'),
    lastOverageChargedAt: timestamp('last_overage_charged_at', { precision: 3 }),
    lastOverageAmount: decimal('last_overage_amount', { precision: 10, scale: 2 }),
    createdAt: timestamp('created_at', { precision: 3 }).defaultNow(),
    updatedAt: timestamp('updated_at', { precision: 3 }),
  },
  t => ({
    org_sub_org_fkey: foreignKey({
      name: 'org_sub_org_fkey',
      columns: [t.organizationId],
      foreignColumns: [Organization.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  })
);

export const Member = pgTable(
  'member',
  {
    id: text('member_id').notNull().primaryKey(),
    organizationId: text('organization_id').notNull(),
    userId: text('user_id').notNull(),
    role: text('role').notNull(),
    createdAt: timestamp('created_at', { precision: 3 }).defaultNow(),
    updatedAt: timestamp('updated_at', { precision: 3 }),
  },
  Member => ({
    member_organization_fkey: foreignKey({
      name: 'member_organization_fkey',
      columns: [Member.organizationId],
      foreignColumns: [Organization.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    member_user_fkey: foreignKey({
      name: 'member_user_fkey',
      columns: [Member.userId],
      foreignColumns: [User.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export const Report = pgTable(
  'report',
  {
    id: text('report_id').notNull().primaryKey(),
    userId: text('user_id').notNull(),
    projectId: text('project_id').notNull(),
    type: text('type').notNull(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    parameters: jsonb('parameters').notNull(),
    createdAt: timestamp('created_at', { precision: 3 }).defaultNow(),
    updatedAt: timestamp('updated_at', { precision: 3 }),
  },
  Report => ({
    report_user_fkey: foreignKey({
      name: 'report_user_fkey',
      columns: [Report.userId],
      foreignColumns: [User.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    report_project_fkey: foreignKey({
      name: 'report_project_fkey',
      columns: [Report.projectId],
      foreignColumns: [Project.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export const Segment = pgTable(
  'segment',
  {
    id: text('segment_id').notNull().primaryKey(),
    projectId: text('project_id').notNull(),
    type: text('type').notNull(),
    name: text('name').notNull(),
    parameters: jsonb('parameters').notNull(),
    createdAt: timestamp('created_at', { precision: 3 }).defaultNow(),
    updatedAt: timestamp('updated_at', { precision: 3 }),
  },
  Segment => ({
    segment_project_fkey: foreignKey({
      name: 'segment_project_fkey',
      columns: [Segment.projectId],
      foreignColumns: [Project.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);



export const Link = pgTable(
  'link',
  {
    id: text('link_id').notNull().primaryKey(),
    name: text('name').notNull(),
    url: text('url').notNull(),
    slug: text('slug').notNull().unique(),
    userId: text('user_id'),
    organizationId: text('organization_id'),
    createdAt: timestamp('created_at', { precision: 3 }).defaultNow(),
    updatedAt: timestamp('updated_at', { precision: 3 }),
    deletedAt: timestamp('deleted_at', { precision: 3 }),
  },
  Link => ({
    link_user_fkey: foreignKey({
      name: 'link_user_fkey',
      columns: [Link.userId],
      foreignColumns: [User.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    link_organization_fkey: foreignKey({
      name: 'link_organization_fkey',
      columns: [Link.organizationId],
      foreignColumns: [Organization.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export const Pixel = pgTable(
  'pixel',
  {
    id: text('pixel_id').notNull().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    userId: text('user_id'),
    organizationId: text('organization_id'),
    createdAt: timestamp('created_at', { precision: 3 }).defaultNow(),
    updatedAt: timestamp('updated_at', { precision: 3 }),
    deletedAt: timestamp('deleted_at', { precision: 3 }),
  },
  Pixel => ({
    pixel_user_fkey: foreignKey({
      name: 'pixel_user_fkey',
      columns: [Pixel.userId],
      foreignColumns: [User.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    pixel_organization_fkey: foreignKey({
      name: 'pixel_organization_fkey',
      columns: [Pixel.organizationId],
      foreignColumns: [Organization.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export const ProjectAccess = pgTable(
  'project_access',
  {
    id: text('id').notNull().primaryKey().default(sql`gen_random_uuid()`),
    projectId: text('project_id').notNull(),
    userId: text('user_id').notNull(),
    organizationId: text('organization_id'),
    level: AccessLevel('level').notNull(),
    createdAt: timestamp('created_at', { precision: 3 }).defaultNow(),
    updatedAt: timestamp('updated_at', { precision: 3 }),
  },
  ProjectAccess => ({
    project_access_project_fkey: foreignKey({
      name: 'project_access_project_fkey',
      columns: [ProjectAccess.projectId],
      foreignColumns: [Project.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    project_access_user_fkey: foreignKey({
      name: 'project_access_user_fkey',
      columns: [ProjectAccess.userId],
      foreignColumns: [User.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    project_access_organization_fkey: foreignKey({
      name: 'project_access_organization_fkey',
      columns: [ProjectAccess.organizationId],
      foreignColumns: [Organization.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export const Invite = pgTable(
  'invite',
  {
    id: text('id').notNull().primaryKey().default(sql`gen_random_uuid()`),
    email: text('email').notNull(),
    createdById: text('created_by_id').notNull(),
    organizationId: text('organization_id'),
    projectAccess: text('projectAccess').array().notNull(),
    role: text('role').notNull().default('member'),
    expiresAt: timestamp('expires_at', { precision: 3 }).notNull(),
    createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { precision: 3 }).notNull(),
  },
  Invite => ({
    invite_organization_fkey: foreignKey({
      name: 'invite_organization_fkey',
      columns: [Invite.organizationId],
      foreignColumns: [Organization.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export const PaymentConnection = pgTable(
  'payment_connection',
  {
    id: text('id').notNull().primaryKey().default(sql`gen_random_uuid()`),
    projectId: text('project_id').notNull(),
    provider: PaymentProvider('provider').notNull(),
    status: PaymentConnectionStatus('status').notNull().default('pending'),
    config: jsonb('config').notNull().default('{}'),
    webhookId: text('webhook_id'),
    webhookSecret: text('webhook_secret'),
    notifyEnabled: boolean('notify_enabled').notNull().default(false),
    startedAt: timestamp('started_at', { precision: 3 }),
    completedAt: timestamp('completed_at', { precision: 3 }),
    createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { precision: 3 }).notNull(),
  },
  PaymentConnection => ({
    payment_connection_project_fkey: foreignKey({
      name: 'payment_connection_project_fkey',
      columns: [PaymentConnection.projectId],
      foreignColumns: [Project.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    PaymentConnection_projectId_provider_unique_idx: uniqueIndex(
      'PaymentConnection_projectId_provider_key',
    ).on(PaymentConnection.projectId, PaymentConnection.provider),
  }),
);



export const Client = pgTable(
  'client',
  {
    id: text('id').notNull().primaryKey().default(sql`gen_random_uuid()`),
    name: text('name').notNull(),
    secret: text('secret'),
    type: ClientType('type').notNull().default('write'),
    projectId: text('project_id'),
    organizationId: text('organization_id'),
    ignoreCorsAndSecret: boolean('ignoreCorsAndSecret').notNull(),
    createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { precision: 3 }).notNull(),
  },
  Client => ({
    client_project_fkey: foreignKey({
      name: 'client_project_fkey',
      columns: [Client.projectId],
      foreignColumns: [Project.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    client_organization_fkey: foreignKey({
      name: 'client_organization_fkey',
      columns: [Client.organizationId],
      foreignColumns: [Organization.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);



export const Share = pgTable(
  'share',
  {
    id: text('share_id').notNull().primaryKey(),
    entityId: text('entity_id').notNull(),
    name: text('name').notNull(),
    shareType: text('share_type').notNull(),
    slug: text('slug').notNull().unique(),
    parameters: jsonb('parameters').notNull(),
    userId: text('user_id'),
    createdAt: timestamp('created_at', { precision: 3 }).defaultNow(),
    updatedAt: timestamp('updated_at', { precision: 3 }),
  },
  Share => ({
    share_user_fkey: foreignKey({
      name: 'share_user_fkey',
      columns: [Share.userId],
      foreignColumns: [User.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    share_project_fkey: foreignKey({
      name: 'share_project_fkey',
      columns: [Share.entityId],
      foreignColumns: [Project.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export const NotificationRule = pgTable(
  'notification_rules',
  {
    id: text('id').notNull().primaryKey().default(sql`gen_random_uuid()`),
    name: text('name').notNull(),
    projectId: text('projectId').notNull(),
    sendToApp: boolean('sendToApp').notNull(),
    sendToEmail: boolean('sendToEmail').notNull(),
    config: jsonb('config').notNull(),
    template: text('template'),
    createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow(),
  },
  NotificationRule => ({
    notification_rules_project_fkey: foreignKey({
      name: 'notification_rules_project_fkey',
      columns: [NotificationRule.projectId],
      foreignColumns: [Project.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export const Notification = pgTable(
  'notifications',
  {
    id: text('id').notNull().primaryKey().default(sql`gen_random_uuid()`),
    projectId: text('projectId').notNull(),
    title: text('title').notNull(),
    message: text('message').notNull(),
    isReadAt: timestamp('is_read_at', { precision: 3 }),
    createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow(),
    source: text('source').notNull().default('event'),
    icon: text('icon'),
    channel: text('channel'),
    sendToApp: boolean('send_to_app').notNull(),
    sendToEmail: boolean('send_to_email').notNull(),
    integrationId: text('integration_id'),
    notificationRuleId: text('notification_rule_id'),
    payload: jsonb('payload'),
  },
  Notification => ({
    notifications_project_fkey: foreignKey({
      name: 'notifications_project_fkey',
      columns: [Notification.projectId],
      foreignColumns: [Project.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    notifications_integration_fkey: foreignKey({
      name: 'notifications_integration_fkey',
      columns: [Notification.integrationId],
      foreignColumns: [Integration.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    notifications_notificationRule_fkey: foreignKey({
      name: 'notifications_notificationRule_fkey',
      columns: [Notification.notificationRuleId],
      foreignColumns: [NotificationRule.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export const Integration = pgTable(
  'integrations',
  {
    id: text('id').notNull().primaryKey().default(sql`gen_random_uuid()`),
    name: text('name').notNull(),
    config: jsonb('config').notNull(),
    organizationId: text('organization_id').notNull(),
    createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { precision: 3 }).notNull().defaultNow(),
  },
  Integration => ({
    integrations_organization_fkey: foreignKey({
      name: 'integrations_organization_fkey',
      columns: [Integration.organizationId],
      foreignColumns: [Organization.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export const ABTest = pgTable(
  'ab_test',
  {
    id: text('id').notNull().primaryKey().default(sql`gen_random_uuid()`),
    projectId: text('project_id').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    goalEventName: text('goal_event_name').notNull(),
    status: ABTestStatus('status').notNull().default('draft'),
    startedAt: timestamp('started_at', { precision: 3 }),
    stoppedAt: timestamp('stopped_at', { precision: 3 }),
    createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { precision: 3 }).notNull(),
  },
  ABTest => ({
    ab_test_project_fkey: foreignKey({
      name: 'ab_test_project_fkey',
      columns: [ABTest.projectId],
      foreignColumns: [Project.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export const ABTestVariant = pgTable(
  'ab_test_variant',
  {
    id: text('id').notNull().primaryKey().default(sql`gen_random_uuid()`),
    testId: text('test_id').notNull(),
    name: text('name').notNull(),
    weight: integer('weight').notNull().default(50),
    createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
  },
  ABTestVariant => ({
    ab_test_variant_test_fkey: foreignKey({
      name: 'ab_test_variant_test_fkey',
      columns: [ABTestVariant.testId],
      foreignColumns: [ABTest.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export const ABTestSession = pgTable(
  'ab_test_session',
  {
    id: text('id').notNull().primaryKey().default(sql`gen_random_uuid()`),
    testId: text('test_id').notNull(),
    variantId: text('variant_id').notNull(),
    sessionId: text('session_id').notNull(),
    converted: boolean('converted').notNull(),
    convertedAt: timestamp('converted_at', { precision: 3 }),
    createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
  },
  ABTestSession => ({
    ab_test_session_test_fkey: foreignKey({
      name: 'ab_test_session_test_fkey',
      columns: [ABTestSession.testId],
      foreignColumns: [ABTest.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    ab_test_session_variant_fkey: foreignKey({
      name: 'ab_test_session_variant_fkey',
      columns: [ABTestSession.variantId],
      foreignColumns: [ABTestVariant.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    ABTestSession_testId_sessionId_unique_idx: uniqueIndex('ABTestSession_testId_sessionId_key').on(
      ABTestSession.testId,
      ABTestSession.sessionId,
    ),
  }),
);



export const IntegrationToNotificationRule = pgTable(
  '_IntegrationToNotificationRule',
  {
    NotificationRuleId: text('A').notNull(),
    IntegrationId: text('B').notNull(),
  },
  IntegrationToNotificationRule => ({
    _IntegrationToNotificationRule_NotificationRule_fkey: foreignKey({
      name: '_IntegrationToNotificationRule_NotificationRule_fkey',
      columns: [IntegrationToNotificationRule.NotificationRuleId],
      foreignColumns: [NotificationRule.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    _IntegrationToNotificationRule_Integration_fkey: foreignKey({
      name: '_IntegrationToNotificationRule_Integration_fkey',
      columns: [IntegrationToNotificationRule.IntegrationId],
      foreignColumns: [Integration.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export const UserRelations = relations(User, ({ many }) => ({
  projects: many(Project, {
    relationName: 'user',
  }),
  createdBy: many(Project, {
    relationName: 'createUser',
  }),
  links: many(Link, {
    relationName: 'user',
  }),
  pixels: many(Pixel, {
    relationName: 'user',
  }),
  members: many(Member, {
    relationName: 'MemberToUser',
  }),
  reports: many(Report, {
    relationName: 'ReportToUser',
  }),
  projectAccess: many(ProjectAccess, {
    relationName: 'ProjectAccessToUser',
  }),
  shares: many(Share, {
    relationName: 'ShareToUser',
  }),
}));

export const ProjectRelations = relations(Project, ({ one, many }) => ({
  user: one(User, {
    relationName: 'user',
    fields: [Project.userId],
    references: [User.id],
  }),
  createUser: one(User, {
    relationName: 'createUser',
    fields: [Project.createdBy],
    references: [User.id],
  }),
  organization: one(Organization, {
    relationName: 'OrganizationToProject',
    fields: [Project.organizationId],
    references: [Organization.id],
  }),
  reports: many(Report, {
    relationName: 'ProjectToReport',
  }),
  segments: many(Segment, {
    relationName: 'ProjectToSegment',
  }),
  projectAccess: many(ProjectAccess, {
    relationName: 'ProjectToProjectAccess',
  }),
  clients: many(Client, {
    relationName: 'ClientToProject',
  }),
  paymentConnections: many(PaymentConnection, {
    relationName: 'PaymentConnectionToProject',
  }),
  shares: many(Share, {
    relationName: 'ProjectToShare',
  }),
  notificationRules: many(NotificationRule, {
    relationName: 'NotificationRuleToProject',
  }),
  notifications: many(Notification, {
    relationName: 'NotificationToProject',
  }),
  abTests: many(ABTest, {
    relationName: 'ABTestToProject',
  }),
}));

export const OrganizationRelations = relations(Organization, ({ one, many }) => ({
  projects: many(Project, {
    relationName: 'OrganizationToProject',
  }),
  members: many(Member, {
    relationName: 'MemberToOrganization',
  }),
  subscription: one(OrganizationSubscription),
  links: many(Link, {
    relationName: 'LinkToOrganization',
  }),
  pixels: many(Pixel, {
    relationName: 'OrganizationToPixel',
  }),
  projectAccess: many(ProjectAccess, {
    relationName: 'OrganizationToProjectAccess',
  }),
  clients: many(Client, {
    relationName: 'ClientToOrganization',
  }),
  invites: many(Invite, {
    relationName: 'InviteToOrganization',
  }),
  integrations: many(Integration, {
    relationName: 'IntegrationToOrganization',
  }),
}));

export const OrganizationSubscriptionRelations = relations(OrganizationSubscription, ({ one }) => ({
  organization: one(Organization, {
    fields: [OrganizationSubscription.organizationId],
    references: [Organization.id],
  }),
}));

export const MemberRelations = relations(Member, ({ one }) => ({
  organization: one(Organization, {
    relationName: 'MemberToOrganization',
    fields: [Member.organizationId],
    references: [Organization.id],
  }),
  user: one(User, {
    relationName: 'MemberToUser',
    fields: [Member.userId],
    references: [User.id],
  }),
}));

export const ReportRelations = relations(Report, ({ one }) => ({
  user: one(User, {
    relationName: 'ReportToUser',
    fields: [Report.userId],
    references: [User.id],
  }),
  project: one(Project, {
    relationName: 'ProjectToReport',
    fields: [Report.projectId],
    references: [Project.id],
  }),
}));

export const SegmentRelations = relations(Segment, ({ one }) => ({
  project: one(Project, {
    relationName: 'ProjectToSegment',
    fields: [Segment.projectId],
    references: [Project.id],
  }),
}));



export const LinkRelations = relations(Link, ({ one }) => ({
  user: one(User, {
    relationName: 'user',
    fields: [Link.userId],
    references: [User.id],
  }),
  organization: one(Organization, {
    relationName: 'LinkToOrganization',
    fields: [Link.organizationId],
    references: [Organization.id],
  }),
}));

export const PixelRelations = relations(Pixel, ({ one }) => ({
  user: one(User, {
    relationName: 'user',
    fields: [Pixel.userId],
    references: [User.id],
  }),
  organization: one(Organization, {
    relationName: 'OrganizationToPixel',
    fields: [Pixel.organizationId],
    references: [Organization.id],
  }),
}));

export const ProjectAccessRelations = relations(ProjectAccess, ({ one }) => ({
  project: one(Project, {
    relationName: 'ProjectToProjectAccess',
    fields: [ProjectAccess.projectId],
    references: [Project.id],
  }),
  user: one(User, {
    relationName: 'ProjectAccessToUser',
    fields: [ProjectAccess.userId],
    references: [User.id],
  }),
  organization: one(Organization, {
    relationName: 'OrganizationToProjectAccess',
    fields: [ProjectAccess.organizationId],
    references: [Organization.id],
  }),
}));

export const InviteRelations = relations(Invite, ({ one }) => ({
  organization: one(Organization, {
    relationName: 'InviteToOrganization',
    fields: [Invite.organizationId],
    references: [Organization.id],
  }),
}));

export const PaymentConnectionRelations = relations(PaymentConnection, ({ one }) => ({
  project: one(Project, {
    relationName: 'PaymentConnectionToProject',
    fields: [PaymentConnection.projectId],
    references: [Project.id],
  }),
}));

export const ClientRelations = relations(Client, ({ one }) => ({
  project: one(Project, {
    relationName: 'ClientToProject',
    fields: [Client.projectId],
    references: [Project.id],
  }),
  organization: one(Organization, {
    relationName: 'ClientToOrganization',
    fields: [Client.organizationId],
    references: [Organization.id],
  }),
}));

export const ShareRelations = relations(Share, ({ one }) => ({
  user: one(User, {
    relationName: 'ShareToUser',
    fields: [Share.userId],
    references: [User.id],
  }),
  project: one(Project, {
    relationName: 'ProjectToShare',
    fields: [Share.entityId],
    references: [Project.id],
  }),
}));

export const NotificationRuleRelations = relations(NotificationRule, ({ one, many }) => ({
  project: one(Project, {
    relationName: 'NotificationRuleToProject',
    fields: [NotificationRule.projectId],
    references: [Project.id],
  }),
  integrations: many(IntegrationToNotificationRule, {
    relationName: 'NotificationRuleToIntegrationToNotificationRule',
  }),
  notifications: many(Notification, {
    relationName: 'NotificationToNotificationRule',
  }),
}));

export const NotificationRelations = relations(Notification, ({ one }) => ({
  project: one(Project, {
    relationName: 'NotificationToProject',
    fields: [Notification.projectId],
    references: [Project.id],
  }),
  integration: one(Integration, {
    relationName: 'IntegrationToNotification',
    fields: [Notification.integrationId],
    references: [Integration.id],
  }),
  notificationRule: one(NotificationRule, {
    relationName: 'NotificationToNotificationRule',
    fields: [Notification.notificationRuleId],
    references: [NotificationRule.id],
  }),
}));

export const IntegrationRelations = relations(Integration, ({ one, many }) => ({
  organization: one(Organization, {
    relationName: 'IntegrationToOrganization',
    fields: [Integration.organizationId],
    references: [Organization.id],
  }),
  notificationRules: many(IntegrationToNotificationRule, {
    relationName: 'IntegrationToIntegrationToNotificationRule',
  }),
  notifications: many(Notification, {
    relationName: 'IntegrationToNotification',
  }),
}));

export const ABTestRelations = relations(ABTest, ({ one, many }) => ({
  project: one(Project, {
    relationName: 'ABTestToProject',
    fields: [ABTest.projectId],
    references: [Project.id],
  }),
  variants: many(ABTestVariant, {
    relationName: 'ABTestToABTestVariant',
  }),
  sessions: many(ABTestSession, {
    relationName: 'ABTestToABTestSession',
  }),
}));

export const ABTestVariantRelations = relations(ABTestVariant, ({ one, many }) => ({
  test: one(ABTest, {
    relationName: 'ABTestToABTestVariant',
    fields: [ABTestVariant.testId],
    references: [ABTest.id],
  }),
  sessions: many(ABTestSession, {
    relationName: 'ABTestSessionToABTestVariant',
  }),
}));

export const ABTestSessionRelations = relations(ABTestSession, ({ one }) => ({
  test: one(ABTest, {
    relationName: 'ABTestToABTestSession',
    fields: [ABTestSession.testId],
    references: [ABTest.id],
  }),
  variant: one(ABTestVariant, {
    relationName: 'ABTestSessionToABTestVariant',
    fields: [ABTestSession.variantId],
    references: [ABTestVariant.id],
  }),
}));

export const IntegrationToNotificationRuleRelations = relations(
  IntegrationToNotificationRule,
  ({ one }) => ({
    NotificationRule: one(NotificationRule, {
      relationName: 'NotificationRuleToIntegrationToNotificationRule',
      fields: [IntegrationToNotificationRule.NotificationRuleId],
      references: [NotificationRule.id],
    }),
    Integration: one(Integration, {
      relationName: 'IntegrationToIntegrationToNotificationRule',
      fields: [IntegrationToNotificationRule.IntegrationId],
      references: [Integration.id],
    }),
  }),
);


