// Drizzle schema — espelho de db/neon/0001_init.sql (fonte da verdade do DDL).
// Autorização é feita nas API routes via Clerk; o browser nunca importa este módulo.
import {
    pgTable, uuid, text, timestamp, decimal, integer, boolean,
    jsonb, date, bigint, uniqueIndex, index,
} from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
    id: uuid('id').defaultRandom().primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
});

export const profiles = pgTable('profiles', {
    id: text('id').primaryKey(), // Clerk user id
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    fullName: text('full_name'),
    avatarUrl: text('avatar_url'),
    phone: text('phone'),
    cpf: text('cpf'),
    birthDate: date('birth_date'),
    gender: text('gender'),
    marketingEmail: boolean('marketing_email').default(true),
    marketingWhatsapp: boolean('marketing_whatsapp').default(true),
    termsAcceptedAt: timestamp('terms_accepted_at', { withTimezone: true }),
});

export const products = pgTable('products', {
    id: uuid('id').defaultRandom().primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    promotionalPrice: decimal('promotional_price', { precision: 10, scale: 2 }),
    imageUrl: text('image_url'),
    categoryId: uuid('category_id').references(() => categories.id),
    active: boolean('active').default(true),
    stock: integer('stock').default(0),
    highlight: boolean('highlight').default(false),
    sizes: text('sizes').array().default(['P', 'M', 'G', 'GG']),
}, (t) => [index('idx_products_category').on(t.categoryId)]);

export const orders = pgTable('orders', {
    id: uuid('id').defaultRandom().primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    userId: text('user_id'), // Clerk id ou 'guest:<email>'
    status: text('status').default('pending'),
    totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
    paymentMethod: text('payment_method').notNull(),
    trackingCode: text('tracking_code'),
    shippingAddress: jsonb('shipping_address'),
    items: jsonb('items'),
    paymentRef: text('payment_ref'),
}, (t) => [
    index('idx_orders_user_id').on(t.userId),
    index('idx_orders_payment_ref').on(t.paymentRef),
]);

export const addresses = pgTable('addresses', {
    id: uuid('id').defaultRandom().primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    userId: text('user_id'),
    recipient: text('recipient').notNull(),
    zipCode: text('zip_code').notNull(),
    state: text('state').notNull(),
    city: text('city').notNull(),
    neighborhood: text('neighborhood').notNull(),
    street: text('street').notNull(),
    number: text('number').notNull(),
    complement: text('complement'),
    isDefault: boolean('is_default').default(false),
}, (t) => [index('idx_addresses_user_id').on(t.userId)]);

export const favorites = pgTable('favorites', {
    id: uuid('id').defaultRandom().primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    userId: text('user_id'),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }),
}, (t) => [
    uniqueIndex('uq_favorites_user_product').on(t.userId, t.productId),
    index('idx_favorites_user_id').on(t.userId),
]);

export const financialConfigs = pgTable('financial_configs', {
    id: uuid('id').defaultRandom().primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    ruleKey: text('rule_key').notNull().unique(),
    ruleValue: decimal('rule_value', { precision: 10, scale: 2 }).notNull(),
    description: text('description'),
});

export const reviews = pgTable('reviews', {
    id: uuid('id').defaultRandom().primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    userId: text('user_id'),
    orderId: text('order_id'),
    productId: uuid('product_id'),
    productName: text('product_name'),
    rating: integer('rating'),
    comment: text('comment'),
    approved: boolean('approved').default(true),
}, (t) => [index('idx_reviews_product').on(t.productId)]);

export const couponRedemptions = pgTable('coupon_redemptions', {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    couponCode: text('coupon_code').notNull(),
    userId: text('user_id').notNull(),
    orderId: text('order_id'),
    redeemedAt: timestamp('redeemed_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
    uniqueIndex('uq_coupon_per_user').on(t.couponCode, t.userId),
    index('idx_coupon_redemptions_user').on(t.userId),
]);
