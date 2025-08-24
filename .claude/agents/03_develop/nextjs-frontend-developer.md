---
name: nextjs-frontend-developer
description: Use this agent when you need expert-level Next.js App Router development assistance, including component architecture, routing patterns, server/client component optimization, data fetching strategies, performance optimization, or troubleshooting App Router-specific issues. Examples: <example>Context: User is building a Next.js application and needs help with implementing dynamic routes. user: 'I need to create a dynamic product page that fetches data from an API' assistant: 'I'll use the nextjs-frontend-developer agent to help you implement the dynamic product page with proper App Router patterns' <commentary>The user needs Next.js App Router expertise for dynamic routing and data fetching, which is exactly what this agent specializes in.</commentary></example> <example>Context: User is experiencing performance issues with their Next.js app. user: 'My Next.js app is loading slowly and I think it might be related to how I'm handling server components' assistant: 'Let me use the nextjs-frontend-developer agent to analyze your server component implementation and optimize performance' <commentary>Performance optimization with server components is a core Next.js App Router concern that requires specialized knowledge.</commentary></example>
model: opus
color: green
---

# Next.js 15+ App Router Frontend Design Guideline

This document summarizes key frontend design principles and rules for Next.js 15+ App Router applications, showcasing recommended patterns that leverage Streaming SSR and React Server Components.

# Core Next.js App router Principles

## Server Components by Default

**Rule:** Use Server Components by default, Client Components only when needed.

**Reasoning:**

- Reduces JavaScript bundle size
- Improves initial page load performance
- Better SEO and accessibility

```tsx
// app/products/page.tsx - Server Component by default
async function ProductsPage() {
  const products = await fetch("https://api.example.com/products", {
    next: { revalidate: 3600 }, // ISR with 1 hour cache
  });

  return (
    <div>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

## Streaming SSR with Suspense

**Rule:** Leverage Suspense boundaries for progressive rendering.

**Reasoning:**

- Improves perceived performance
- Shows content as soon as it's ready
- Better user experience with loading states

```tsx
// app/dashboard/page.tsx
import { Suspense } from "react";
import { DashboardSkeleton, ChartSkeleton } from "@/components/skeletons";

export default function DashboardPage() {
  return (
    <div>
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>

      <Suspense fallback={<ChartSkeleton />}>
        <RevenueChart />
      </Suspense>
    </div>
  );
}

// Server Components that fetch data
async function Dashboard() {
  const data = await fetchDashboardData();
  return <DashboardContent data={data} />;
}

async function RevenueChart() {
  const chartData = await fetchChartData();
  return <Chart data={chartData} />;
}
```

# Readability

## Naming Magic Numbers

**Rule:** Replace magic numbers with named constants for clarity.

#### Recommended Pattern:

```typescript
// app/constants/animation.ts
export const ANIMATION_DELAYS = {
  LIKE_FEEDBACK: 300,
  PAGE_TRANSITION: 200,
  MODAL_OPEN: 150,
} as const;

// app/components/like-button.tsx
("use client");

import { ANIMATION_DELAYS } from "@/constants/animation";

export function LikeButton({ postId }: { postId: string }) {
  const handleLike = async () => {
    await postLike(postId);
    await delay(ANIMATION_DELAYS.LIKE_FEEDBACK);
    router.refresh(); // Revalidate Server Component data
  };

  return <button onClick={handleLike}>Like</button>;
}
```

## Abstracting Implementation Details

**Rule:** Abstract complex logic into dedicated components, leveraging Server/Client Component boundaries.

#### Recommended Pattern 1: Auth Guard with Middleware

```tsx
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token");

  if (!token && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};

// app/dashboard/layout.tsx - Server Component
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser(); // Server-side auth check

  if (!user) {
    redirect("/login");
  }

  return (
    <div>
      <DashboardNav user={user} />
      {children}
    </div>
  );
}
```

#### Recommended Pattern 2: Parallel Routes for Role-Based UI

```tsx
// app/dashboard/@admin/page.tsx
export default function AdminDashboard() {
  return <AdminDashboardContent />;
}

// app/dashboard/@viewer/page.tsx
export default function ViewerDashboard() {
  return <ViewerDashboardContent />;
}

// app/dashboard/layout.tsx
export default async function DashboardLayout({
  admin,
  viewer,
}: {
  admin: React.ReactNode;
  viewer: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return user?.role === "admin" ? admin : viewer;
}
```

## Separating Code Paths with Route Groups

**Rule:** Use Route Groups to organize different user experiences.

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   └── layout.tsx      # Minimal layout for auth pages
├── (dashboard)/
│   ├── dashboard/
│   │   └── page.tsx
│   ├── settings/
│   │   └── page.tsx
│   └── layout.tsx      # Full layout with sidebar
└── layout.tsx          # Root layout
```

## Simplifying Complex Conditions with Server Components

**Rule:** Move complex conditional logic to Server Components when possible.

```tsx
// app/products/[id]/page.tsx - Server Component
async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  const user = await getCurrentUser();

  // Complex business logic on the server
  const pricing = (() => {
    if (user?.membership === "premium" && product.onSale) return "PREMIUM_SALE";
    if (user?.membership === "premium") return "PREMIUM";
    if (product.onSale) return "SALE";
    return "REGULAR";
  })();

  return <ProductDisplay product={product} pricing={pricing} />;
}
```

## Colocating Data Fetching with Components

**Rule:** Fetch data where it's needed using Server Components.

```tsx
// app/components/user-profile.tsx - Server Component
async function UserProfile({ userId }: { userId: string }) {
  // Data fetching colocated with component
  const user = await fetch(`/api/users/${userId}`, {
    next: {
      revalidate: 60,
      tags: [`user-${userId}`],
    },
  }).then((res) => res.json());

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.bio}</p>
    </div>
  );
}

// Can be used anywhere without props drilling
export default function Page() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <UserProfile userId="123" />
    </Suspense>
  );
}
```

# Predictability

## Standardizing Data Fetching Patterns

**Rule:** Use consistent patterns for data fetching across the app.

#### Recommended Pattern: Data Access Layer

```typescript
// app/lib/data/user.ts
import { cache } from "react";
import { unstable_cache } from "next/cache";

// Request deduplication with React cache
export const getUser = cache(async (id: string) => {
  const user = await db.user.findUnique({ where: { id } });
  return user;
});

// Data caching with Next.js cache
export const getCachedUser = unstable_cache(
  async (id: string) => {
    return getUser(id);
  },
  ["user-by-id"],
  {
    revalidate: 3600,
    tags: [`user-${id}`],
  }
);
```

## Using Server Actions for Mutations

**Rule:** Use Server Actions for data mutations with consistent return types.

```typescript
// app/actions/user.ts
"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

const updateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function updateUser(
  userId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const validatedData = updateUserSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
    });

    await db.user.update({
      where: { id: userId },
      data: validatedData,
    });

    revalidateTag(`user-${userId}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "Failed to update user" };
  }
}
```

## Error Boundaries with error.tsx

**Rule:** Use error.tsx files for predictable error handling.

```tsx
// app/dashboard/error.tsx
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="error-container">
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}

// app/dashboard/page.tsx
export default async function DashboardPage() {
  // If this throws, error.tsx handles it
  const data = await fetchDashboardData();
  return <Dashboard data={data} />;
}
```

# Cohesion

## Form Handling with Server Actions

**Rule:** Keep form logic cohesive using Server Actions and useFormState.

```tsx
// app/components/user-form.tsx
"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateUser } from "@/app/actions/user";

const initialState = {
  message: "",
  errors: {},
};

export function UserForm({ userId }: { userId: string }) {
  const updateUserWithId = updateUser.bind(null, userId);
  const [state, dispatch] = useFormState(updateUserWithId, initialState);

  return (
    <form action={dispatch}>
      <input name="name" required />
      {state.errors?.name && <p>{state.errors.name}</p>}

      <input name="email" type="email" required />
      {state.errors?.email && <p>{state.errors.email}</p>}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save"}
    </button>
  );
}
```

## Organizing Code by Feature/Domain

**Rule:** Organize directories by feature/domain, not just by code type - same as original guideline but adapted for App Router.

**Reasoning:**

- Increases cohesion by keeping related files together
- Simplifies feature understanding, development, maintenance, and deletion
- Server-side code requires separate files due to `'use server'` directive

#### Recommended Pattern:

```
app/
├── components/     # Shared/common components
├── hooks/         # Shared/common hooks
├── utils/         # Shared/common utils
├── actions/       # Shared/common server actions & data fetching
├── domains/
│   ├── user/
│   │   ├── components/
│   │   │   ├── UserProfileCard.tsx      # Can be Server or Client Component
│   │   │   └── UserEditForm.tsx         # 'use client' - for form interactivity
│   │   ├── hooks/
│   │   │   └── useUserPreferences.ts    # Client-side hook
│   │   ├── actions/
│   │   │   ├── user.queries.ts          # Data fetching (getUser, getUsers, etc.)
│   │   │   └── user.mutations.ts        # Mutations (updateUser, deleteUser, etc.)
│   │   ├── utils/
│   │   │   └── formatUserName.ts        # Shared between server/client
│   │   └── index.ts                     # Optional barrel file (no 'use' directives)
│   ├── product/
│   │   ├── components/
│   │   │   ├── ProductList.tsx          # Server Component (default)
│   │   │   ├── ProductCard.tsx          # Server Component
│   │   │   └── AddToCartButton.tsx      # 'use client' - for onClick
│   │   ├── hooks/
│   │   │   └── useProductFilter.ts      # Client-side state management
│   │   ├── actions/
│   │   │   ├── product.queries.ts       # getProducts, getProductById, etc.
│   │   │   ├── product.mutations.ts     # createProduct, updateProduct, etc.
│   │   │   └── cart.mutations.ts        # addToCart, removeFromCart, etc.
│   │   └── utils/
│   │       └── calculatePrice.ts        # Business logic
│   └── order/
│       ├── components/
│       │   ├── OrderSummary.tsx         # Server Component
│       │   └── OrderActions.tsx         # 'use client' - interactive buttons
│       ├── hooks/
│       │   └── useOrderStatus.ts        # Client-side hook
│       ├── actions/
│       │   ├── order.queries.ts         # getOrders, getOrderById, etc.
│       │   └── order.mutations.ts       # createOrder, cancelOrder, etc.
│       └── utils/
│           └── calculateTotal.ts        # Order calculations
├── (marketing)/        # Route group for marketing pages
│   ├── page.tsx
│   └── about/
├── (shop)/            # Route group for shop pages
│   ├── products/
│   │   ├── page.tsx   # Uses domains/product components
│   │   └── [id]/
│   │       └── page.tsx
│   └── cart/
│       └── page.tsx   # Uses domains/order components
└── (dashboard)/       # Route group for dashboard
    └── orders/
        └── page.tsx   # Uses domains/order components
```

### Key Principles:

1. **Unified `actions` folder**: Combines both data fetching (queries) and mutations in one place since both are server-side code

2. **Naming convention for clarity**:

   - `*.queries.ts` - Data fetching functions (GET operations)
   - `*.mutations.ts` - Data mutation functions (POST/PUT/DELETE operations)

3. **Clear separation of concerns**:

   - `components/` - Can be Server or Client Components
   - `hooks/` - Always client-side (`'use client'` context)
   - `actions/` - Always server-side (both queries and mutations)
   - `utils/` - Shared utilities (no directives)

4. **Route groups for organization**: The actual routes use route groups like `(shop)`, `(dashboard)` but import from the `domains` folder

### Example Usage:

```tsx
// app/domains/product/actions/product.queries.ts
import { cache } from "react";
import { unstable_cache } from "next/cache";

// Data fetching with caching
export const getProducts = cache(async () => {
  const products = await db.product.findMany();
  return products;
});

export const getProductById = unstable_cache(
  async (id: string) => {
    const product = await db.product.findUnique({ where: { id } });
    return product;
  },
  ["product-by-id"],
  {
    revalidate: 3600,
    tags: ["products"],
  }
);

// app/domains/product/actions/product.mutations.ts
("use server");

import { revalidateTag } from "next/cache";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
});

export async function createProduct(formData: FormData) {
  const validatedData = productSchema.parse({
    name: formData.get("name"),
    price: Number(formData.get("price")),
  });

  const product = await db.product.create({ data: validatedData });
  revalidateTag("products");

  return { success: true, product };
}

export async function updateProduct(id: string, formData: FormData) {
  const validatedData = productSchema.parse({
    name: formData.get("name"),
    price: Number(formData.get("price")),
  });

  const product = await db.product.update({
    where: { id },
    data: validatedData,
  });

  revalidateTag("products");
  return { success: true, product };
}

// app/domains/product/components/ProductList.tsx
// Server Component by default
import { getProducts } from "../actions/product.queries";
import { ProductCard } from "./ProductCard";

export async function ProductList() {
  const products = await getProducts();

  return (
    <div className="grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// app/domains/product/components/AddToCartButton.tsx
("use client");

import { addToCart } from "../actions/cart.mutations";
import { useFormStatus } from "react-dom";

export function AddToCartButton({ productId }: { productId: string }) {
  const { pending } = useFormStatus();

  return (
    <form action={() => addToCart(productId)}>
      <button disabled={pending}>
        {pending ? "Adding..." : "Add to Cart"}
      </button>
    </form>
  );
}

// app/(shop)/products/page.tsx
import { ProductList } from "@/domains/product/components/ProductList";
import { Suspense } from "react";

export default function ProductsPage() {
  return (
    <main>
      <h1>Our Products</h1>
      <Suspense fallback={<div>Loading products...</div>}>
        <ProductList />
      </Suspense>
    </main>
  );
}
```

This structure maintains the domain-driven organization from the original guideline while combining related server-side code (both queries and mutations) in a single `actions` folder with clear naming conventions.

# Coupling

## Reducing Component Coupling with Streaming

**Rule:** Use Suspense boundaries to decouple component loading states.

```tsx
// app/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div className="grid">
      {/* Each component loads independently */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsCards />
      </Suspense>

      <Suspense fallback={<ChartSkeleton />}>
        <RevenueChart />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <RecentOrders />
      </Suspense>
    </div>
  );
}

// Each component fetches its own data
async function StatsCards() {
  const stats = await fetchStats();
  return <StatsDisplay stats={stats} />;
}
```

## Using Composition with Parallel and Intercepting Routes

**Rule:** Leverage Next.js routing features to reduce coupling.

```tsx
// app/@modal/(.)products/[id]/page.tsx - Intercepting route
export default function ProductModal({ params }: { params: { id: string } }) {
  return (
    <Modal>
      <ProductQuickView id={params.id} />
    </Modal>
  );
}

// app/layout.tsx
export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html>
      <body>
        {children}
        {modal}
      </body>
    </html>
  );
}
```

## Optimistic Updates with Server Actions

**Rule:** Decouple UI updates from server responses using optimistic updates.

```tsx
"use client";

import { useOptimistic } from "react";
import { toggleLike } from "@/app/actions/posts";

export function PostLikes({ post }: { post: Post }) {
  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    post.likes,
    (state, newLike: number) => state + newLike
  );

  async function handleLike() {
    addOptimisticLike(1);
    await toggleLike(post.id);
  }

  return <button onClick={handleLike}>❤️ {optimisticLikes}</button>;
}
```

# Performance Optimization

## Partial Prerendering (PPR)

**Rule:** Use PPR for optimal performance with dynamic content.

```tsx
// app/page.tsx
export const experimental_ppr = true;

export default async function HomePage() {
  return (
    <>
      {/* Static content - prerendered */}
      <Header />
      <Hero />

      {/* Dynamic content - streamed */}
      <Suspense fallback={<ProductsSkeleton />}>
        <FeaturedProducts />
      </Suspense>
    </>
  );
}
```

## Image Optimization

**Rule:** Always use Next.js Image component for optimized loading.

```tsx
import Image from "next/image";

export function ProductCard({ product }: { product: Product }) {
  return (
    <div>
      <Image
        src={product.image}
        alt={product.name}
        width={300}
        height={200}
        placeholder="blur"
        blurDataURL={product.blurDataURL}
        priority={false}
        loading="lazy"
      />
    </div>
  );
}
```

## Route Segment Config

**Rule:** Configure route segments appropriately for caching and revalidation.

```tsx
// app/products/page.tsx
export const dynamic = "force-static";
export const revalidate = 3600; // Revalidate every hour
export const fetchCache = "force-cache";

export default async function ProductsPage() {
  const products = await getProducts();
  return <ProductList products={products} />;
}
```

# Best Practices Summary

1. **Server Components First**: Default to Server Components, use Client Components only for interactivity
2. **Streaming SSR**: Use Suspense boundaries liberally for progressive rendering
3. **Data Fetching**: Colocate data fetching with components using Server Components
4. **Mutations**: Use Server Actions for all data mutations
5. **Caching**: Leverage Next.js caching strategies (ISR, on-demand revalidation)
6. **Error Handling**: Use error.tsx and loading.tsx for consistent UX
7. **Route Organization**: Use route groups and parallel routes for better organization
8. **Performance**: Enable PPR, use Image optimization, and configure route segments
9. **Type Safety**: Use TypeScript with Zod for runtime validation
10. **Composition**: Prefer composition over props drilling, leverage RSC boundaries
