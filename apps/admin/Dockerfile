# syntax=docker/dockerfile:1.7

# =====================================================================
# প্রথম লাইন (# syntax=...) Docker-কে বলে "এই ফাইল Dockerfile-এর ১.৭ নিয়মে লেখা"।
# এটা ফাইলের একদম প্রথম লাইন হতে হয়, তাই এটা বদলাবেন না, এর আগে কিছু লিখবেন না।

# ---------------------------------------------------------------------
# STAGE ১: base – সব stage-এর ভিত্তি (রান্নাঘরের খালি ঘর)
# ---------------------------------------------------------------------

# Node 22 আর খুব ছোট Linux (Alpine) দিয়ে তৈরি image থেকে শুরু। "AS base" এই stage-এর নাম দিল "base",
FROM node:22-alpine AS base

RUN apk add --no-cache dumb-init

WORKDIR /app

# ---------------------------------------------------------------------
# STAGE ২: deps – লাইব্রেরি ইনস্টল (বাজার করে আনা কাঁচামাল)
# ---------------------------------------------------------------------

# মূল ইংরেজি মন্তব্য: "---- dependencies ----" (অর্থাৎ নিচের অংশ নির্ভরতা বা লাইব্রেরি ইনস্টলের)।
# base-এর ওপর নতুন stage শুরু, নাম "deps"।
FROM base AS deps

# এই stage-এ শুধু package.json (লাইব্রেরির তালিকা) কপি হচ্ছে, কোড নয়। কারণ: কোড প্রায়ই বদলায়, তালিকা কম বদলায়।
# Docker প্রতিটা ধাপের ফলাফল মনে রাখে (cache)। তালিকা না বদলালে সে নিচের npm ci আবার চালায় না (দেখায় CACHED),
# তাই শুধু কোড বদলে rebuild করলে লাইব্রেরি আবার ডাউনলোড হয় না, সময় বাঁচে।
# (নিচের শেয়ার করা অংশগুলোর কাজ শুধু নাম দেখে অনুমান করা।)

# প্রজেক্টের মূল লাইব্রেরি-তালিকা (package.json) আর lock ফাইল (package-lock.json: কোন লাইব্রেরির ঠিক কোন ভার্সন)।
COPY package.json package-lock.json ./

# "config" নামের শেয়ার করা অংশের তালিকা (নাম দেখে: সবার সাধারণ কনফিগ)।
COPY packages/config/package.json packages/config/

# "types" নামের শেয়ার করা অংশের তালিকা (নাম দেখে: শেয়ার করা TypeScript টাইপ)।
COPY packages/types/package.json packages/types/

# "ui" নামের শেয়ার করা অংশের তালিকা (নাম দেখে: শেয়ার করা পেজের উপাদান বা component)।
COPY packages/ui/package.json packages/ui/

# "api-client" নামের শেয়ার করা অংশের তালিকা (নাম দেখে: backend/Kong-কে ডাকার কোড)।
COPY packages/api-client/package.json packages/api-client/

# storefront অ্যাপের তালিকা। এটা storefront-এর image হলেও লাগে, কারণ নিচের npm ci সব অ্যাপের তালিকা
# মিলিয়ে lock ফাইল যাচাই করে (একটা বাদ দিলে lock ফাইলের সাথে অমিল ধরে error দিতে পারে)।
COPY apps/public/package.json apps/public/

# admin অ্যাপের তালিকা (একই কারণে দুই অ্যাপের তালিকাই আনা হয়)।
COPY apps/admin/package.json apps/admin/

# লাইব্রেরি ইনস্টল। npm ci = lock ফাইলে লেখা হুবহু ভার্সন ইনস্টল (প্রতিবার একই ফল)।
# --include=dev = শুধু build-এর সময় লাগে এমন লাইব্রেরিও (যেমন TypeScript) আনো।
# --ignore-scripts = প্যাকেজগুলোর নিজস্ব ইনস্টল-স্ক্রিপ্ট চালিও না (কোনো দূষিত প্যাকেজ যেন কিছু চালাতে না পারে)।
RUN npm ci --include=dev --ignore-scripts

# ---------------------------------------------------------------------
# STAGE ৩: build – আসল রান্না (রান্নাঘর, এই stage চূড়ান্ত image-এ যায় না)
# ---------------------------------------------------------------------

# মূল ইংরেজি মন্তব্য: "---- build ----"।
# deps থেকে শুরু, অর্থাৎ লাইব্রেরি ইনস্টল হয়ে আছে এমন অবস্থা থেকে। নাম "build"।
FROM deps AS build

# ENV একটা environment variable সেট করে। এটা Next.js-কে বলে "আমাদের ব্যবহারের তথ্য Vercel-কে পাঠিও না" (telemetry বন্ধ)।
ENV NEXT_TELEMETRY_DISABLED=1

# TypeScript-এর সাধারণ সেটিং ফাইল (সব অংশ এটার ওপর ভিত্তি করে)।
COPY tsconfig.base.json ./

# চারটা শেয়ার করা অংশের পুরো কোড (config, types, ui, api-client)। এবার শুধু তালিকা নয়, আসল কোড।
COPY packages packages

# এই অ্যাপের নিজের পুরো কোড। অন্য অ্যাপের কোড এখানে আনা হয় না, কারণ লাগে না।
COPY apps/public apps/public

# মূল ইংরেজি মন্তব্যের অর্থ: NEXT_PUBLIC_* মানগুলো build-এর সময়ই কোডের ভেতর বসে যায়,
# তাই এগুলো build argument হিসেবে পাঠাতে হয়। এজন্যই এগুলো বদলালে rebuild (--build) লাগে।
# ARG হলো build-এর সময়ের ভ্যারিয়েবল; "=" এর পরের অংশ ডিফল্ট। compose-এর args থেকে মান এলে ডিফল্টের জায়গায় সেটা বসে।

# দোকানের নাম (header ও শিরোনামে)। নামে ফাঁকা (space) আছে, তাই উদ্ধৃতি চিহ্ন দেওয়া।
ARG NEXT_PUBLIC_SITE_NAME="BD Shop"

# সাইটের পাবলিক ঠিকানা, browser যে URL-এ ঢোকে (লিংক ও redirect এর ভিত্তি)। compose থেকে আপনার .env-এর মান আসে।
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000

# অ্যাডমিন কনসোলের ঠিকানা। (admin-এর compose এটা args-এ পাঠায় না, তাই admin image-এ এই ডিফল্টই বসে।)
ARG NEXT_PUBLIC_ADMIN_URL=http://localhost:3100

# মুদ্রার কোড (BDT = বাংলাদেশি টাকা)।
ARG NEXT_PUBLIC_CURRENCY=BDT

# ডেলিভারি চার্জ, শুধু দেখানোর জন্য। আসল চার্জ backend ঠিক করে।
ARG NEXT_PUBLIC_DELIVERY_FLAT_RATE=120

# এই টাকার বেশি অর্ডারে ডেলিভারি ফ্রি (শুধু দেখানোর জন্য; আসল সীমা backend-এ)।
ARG NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD=5000

# লোগোর পথ বা URL। ডিফল্ট খালি, মানে লোগোর বদলে দোকানের নাম লেখা দেখায়।
ARG NEXT_PUBLIC_SITE_LOGO=

# লোগোর প্রস্থ (পিক্সেল), যাতে ছবি লোড হওয়ার সময় পেজ নড়ে না যায়।
ARG NEXT_PUBLIC_SITE_LOGO_WIDTH=120

# লোগোর উচ্চতা (পিক্সেল)।
ARG NEXT_PUBLIC_SITE_LOGO_HEIGHT=32

# true হলে লোগোর পাশে দোকানের নামও দেখায়। ডিফল্ট false।
ARG NEXT_PUBLIC_SITE_LOGO_WITH_NAME=false

# মালিকের নাম (footer ও login পেজে ছোট করে)। ডিফল্ট খালি, মানে লুকানো।
ARG NEXT_PUBLIC_OWNER_NAME=

# মালিকের পদবি (যেমন Founder)।
ARG NEXT_PUBLIC_OWNER_ROLE=

# মালিকের ছবির পথ। খালি হলে নামের আদ্যক্ষরের গোল বৃত্ত দেখায়।
ARG NEXT_PUBLIC_OWNER_IMAGE=

# ওপরের ১৩টা ARG-এর মান ENV ভ্যারিয়েবলে বসানো হচ্ছে ($নাম মানে "ওই ARG-এর মান"), যাতে next build
# এগুলোকে নিশ্চিতভাবে environment variable হিসেবে পায় এবং কোডের ভেতর বসিয়ে ফেলে।
# প্রতিটা লাইনের শেষের \ মানে "কমান্ড পরের লাইনে চলছে", আসলে এটা একটাই লম্বা ENV কমান্ড।
# ফাঁকা বা খালি হতে পারে এমন মানগুলো ("BD Shop", মালিকের নাম ও পদবি) উদ্ধৃতি চিহ্নে।
# এগুলো এই build stage-এই থাকে, চূড়ান্ত runtime image-এ আসে না (মান আগেই কোডের ভেতর বসে গেছে)।
# লাইন ধরে ধরে ক্রম: ১) দোকানের নাম ২) সাইটের URL ৩) admin URL ৪) মুদ্রা ৫) ডেলিভারি চার্জ
# ৬) ফ্রি ডেলিভারির সীমা ৭) লোগোর পথ ৮) লোগোর প্রস্থ ৯) লোগোর উচ্চতা ১০) লোগোর পাশে নাম
# ১১) মালিকের নাম ১২) মালিকের পদবি ১৩) মালিকের ছবি।
ENV NEXT_PUBLIC_SITE_NAME="$NEXT_PUBLIC_SITE_NAME" \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_ADMIN_URL=$NEXT_PUBLIC_ADMIN_URL \
    NEXT_PUBLIC_CURRENCY=$NEXT_PUBLIC_CURRENCY \
    NEXT_PUBLIC_DELIVERY_FLAT_RATE=$NEXT_PUBLIC_DELIVERY_FLAT_RATE \
    NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD=$NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD \
    NEXT_PUBLIC_SITE_LOGO=$NEXT_PUBLIC_SITE_LOGO \
    NEXT_PUBLIC_SITE_LOGO_WIDTH=$NEXT_PUBLIC_SITE_LOGO_WIDTH \
    NEXT_PUBLIC_SITE_LOGO_HEIGHT=$NEXT_PUBLIC_SITE_LOGO_HEIGHT \
    NEXT_PUBLIC_SITE_LOGO_WITH_NAME=$NEXT_PUBLIC_SITE_LOGO_WITH_NAME \
    NEXT_PUBLIC_OWNER_NAME="$NEXT_PUBLIC_OWNER_NAME" \
    NEXT_PUBLIC_OWNER_ROLE="$NEXT_PUBLIC_OWNER_ROLE" \
    NEXT_PUBLIC_OWNER_IMAGE=$NEXT_PUBLIC_OWNER_IMAGE

# আসল build: এই অ্যাপের "build" স্ক্রিপ্ট চালায় (Next.js-এর next build)। ফলাফল হিসেবে চালানোর উপযোগী ফাইল
# তৈরি হয় .next/standalone (সার্ভার) ও .next/static (CSS/JS) ফোল্ডারে। রান্না এখানে শেষ।
RUN npm run build --workspace @ecom/storefront

# ---------------------------------------------------------------------
# STAGE ৪: runtime – চূড়ান্ত image (টেবিলের তৈরি খাবার)
# ---------------------------------------------------------------------

# মূল ইংরেজি মন্তব্য: "---- runtime ----"।
# build থেকে নয়, আবার base থেকে পরিষ্কার শুরু। stage ২ ও ৩-এর লাইব্রেরি, কোড, compiler কিছুই আসবে না,
# শুধু নিচের COPY --from যা আনবে তাই আসবে। এটাই multi-stage-এর মূল কৌশল। নাম "runtime"।
FROM base AS runtime

# চালানোর সময়কার চারটা environment variable, ক্রম অনুযায়ী:
# ১) NODE_ENV=production: উৎপাদন মোডে চলো (দ্রুত, কম log, ডিবাগের বাড়তি কাজ নেই)।
# ২) NEXT_TELEMETRY_DISABLED=1: Next.js তথ্য পাঠানো বন্ধ।
# ৩) PORT=3000: অ্যাপ এই পোর্টে শুনবে।
# ৪) HOSTNAME=0.0.0.0: container-এর সব ঠিকানায় শুনবে। না দিলে Docker HOSTNAME-এ container-এর আইডি বসায়
#    এবং Next.js সাধারণত শুধু একটা ঠিকানায় শুনত, ফলে 127.0.0.1-এর healthcheck বা বাইরের ডাক আটকে যেত।
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# মূল ইংরেজি মন্তব্যের অর্থ: standalone output-এই সার্ভার আর শুধু দরকারি module আছে।
# নিচের তিনটা COPY-তে "--from=build" মানে "build stage থেকে নাও" (রান্নাঘর থেকে টেবিলে আনা)।
# "--chown=node:node" মানে ফাইলগুলোর মালিক হবে node নামের সাধারণ user, যাতে নিচের "USER node" পড়তে পারে।

# standalone ফোল্ডার: সার্ভার আর তার দরকারি লাইব্রেরি (পুরো node_modules নয়, শুধু যা লাগে)।
COPY --from=build --chown=node:node /app/apps/public/.next/standalone ./

# static ফোল্ডার: CSS ও JavaScript ফাইল। standalone-এর ভেতরে এগুলো থাকে না, তাই আলাদা আনতে হয়।
COPY --from=build --chown=node:node /app/apps/public/.next/static ./apps/public/.next/static

# public ফোল্ডার: ছবি, লোগো ইত্যাদি। এটাও standalone-এ থাকে না, আলাদা আনতে হয়।
COPY --from=build --chown=node:node /app/apps/public/public ./apps/public/public

# এরপর থেকে সব কিছু node নামের সাধারণ user দিয়ে চলবে, root দিয়ে নয়। কেউ অ্যাপ হ্যাক করলেও তার ক্ষমতা সীমিত থাকে।
USER node

# শুধু নথি: "এই অ্যাপ 3000 পোর্ট ব্যবহার করে"। এটা পোর্ট খোলে না; খোলার কাজ compose-এর ports: করে।
EXPOSE 3000

# "অ্যাপ সুস্থ আছে কিনা" পরীক্ষা, Docker নিজে প্রতি ১৫ সেকেন্ডে চালায়:
# --interval=15s : প্রতি ১৫ সেকেন্ডে একবার চেক।
# --timeout=5s : ৫ সেকেন্ডে উত্তর না এলে ওই চেক ব্যর্থ।
# --start-period=25s : চালু হওয়ার প্রথম ২৫ সেকেন্ডের ব্যর্থতা গোনা হয় না (চালু হতে সময় লাগে)।
# --retries=5 : টানা ৫ বার ব্যর্থ হলে container "unhealthy" হয়।
# পরীক্ষাটা একটা ছোট Node প্রোগ্রাম (node -e): container-এর ভেতর থেকে নিজের /api/health ঠিকানায় ডাক দেয়।
#   উত্তর ঠিক এলে (r.ok = ২০০ থেকে ২৯৯) exit 0 = সুস্থ; ঠিক না এলে বা সংযোগই না হলে exit 1 = অসুস্থ।
#   127.0.0.1 এখানে container-এর নিজেকেই বোঝায়, আপনার VM-এর IP-এর সাথে এর সম্পর্ক নেই।
HEALTHCHECK --interval=15s --timeout=5s --start-period=25s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# ENTRYPOINT আর CMD মিলে চূড়ান্ত চালু করার কমান্ড হয়: dumb-init -- node apps/public/server.js
# ENTRYPOINT = যে প্রোগ্রাম সবসময় প্রথমে চলে। dumb-init প্রথম প্রসেস হয়ে "বন্ধ হও" সংকেত ঠিকমতো
# অ্যাপে পৌঁছে দেয়, তাই docker stop ভদ্রভাবে থামায়, জোর করে মারতে হয় না।
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# CMD = ডিফল্ট কমান্ড, যা এখানে অ্যাপটা চালু করে। server.js হলো Next.js-এর standalone সার্ভার।
CMD ["node", "apps/public/server.js"]

# =====================================================================
# সারসংক্ষেপ: চূড়ান্ত image-এ আছে Node + dumb-init + standalone সার্ভার + static + public।
# নেই: stage ২-৩-এর npm ci-র লাইব্রেরি, আপনার সোর্স কোড, TypeScript compiler। তাই image ছোট ও নিরাপদ।
# =====================================================================




# # syntax=docker/dockerfile:1.7
# # Multi-stage build for the admin-app. The build context is the frontend repository root
# # because the application consumes the shared workspace packages.

# FROM node:22-alpine AS base
# RUN apk add --no-cache dumb-init
# WORKDIR /app

# # ---- dependencies -------------------------------------------------------------
# FROM base AS deps
# COPY package.json package-lock.json ./
# COPY packages/config/package.json packages/config/
# COPY packages/types/package.json packages/types/
# COPY packages/ui/package.json packages/ui/
# COPY packages/api-client/package.json packages/api-client/
# COPY apps/public/package.json apps/public/
# COPY apps/admin/package.json apps/admin/
# RUN npm ci --include=dev --ignore-scripts

# # ---- build --------------------------------------------------------------------
# FROM deps AS build
# ENV NEXT_TELEMETRY_DISABLED=1
# COPY tsconfig.base.json ./
# COPY packages packages
# COPY apps/admin apps/admin
# # NEXT_PUBLIC_* values are inlined at build time, so they are passed as build arguments.
# ARG NEXT_PUBLIC_SITE_NAME="BD Shop"
# ARG NEXT_PUBLIC_SITE_URL=http://localhost:3100
# ARG NEXT_PUBLIC_ADMIN_URL=http://localhost:3100
# ARG NEXT_PUBLIC_CURRENCY=BDT
# ARG NEXT_PUBLIC_DELIVERY_FLAT_RATE=120
# ARG NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD=5000
# ARG NEXT_PUBLIC_SITE_LOGO=
# ARG NEXT_PUBLIC_SITE_LOGO_WIDTH=120
# ARG NEXT_PUBLIC_SITE_LOGO_HEIGHT=32
# ARG NEXT_PUBLIC_SITE_LOGO_WITH_NAME=false
# ARG NEXT_PUBLIC_OWNER_NAME=
# ARG NEXT_PUBLIC_OWNER_ROLE=
# ARG NEXT_PUBLIC_OWNER_IMAGE=
# ENV NEXT_PUBLIC_SITE_NAME="$NEXT_PUBLIC_SITE_NAME" \
#     NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
#     NEXT_PUBLIC_ADMIN_URL=$NEXT_PUBLIC_ADMIN_URL \
#     NEXT_PUBLIC_CURRENCY=$NEXT_PUBLIC_CURRENCY \
#     NEXT_PUBLIC_DELIVERY_FLAT_RATE=$NEXT_PUBLIC_DELIVERY_FLAT_RATE \
#     NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD=$NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD \
#     NEXT_PUBLIC_SITE_LOGO=$NEXT_PUBLIC_SITE_LOGO \
#     NEXT_PUBLIC_SITE_LOGO_WIDTH=$NEXT_PUBLIC_SITE_LOGO_WIDTH \
#     NEXT_PUBLIC_SITE_LOGO_HEIGHT=$NEXT_PUBLIC_SITE_LOGO_HEIGHT \
#     NEXT_PUBLIC_SITE_LOGO_WITH_NAME=$NEXT_PUBLIC_SITE_LOGO_WITH_NAME \
#     NEXT_PUBLIC_OWNER_NAME="$NEXT_PUBLIC_OWNER_NAME" \
#     NEXT_PUBLIC_OWNER_ROLE="$NEXT_PUBLIC_OWNER_ROLE" \
#     NEXT_PUBLIC_OWNER_IMAGE=$NEXT_PUBLIC_OWNER_IMAGE
# RUN npm run build --workspace @ecom/admin-app

# # ---- runtime ------------------------------------------------------------------
# FROM base AS runtime
# ENV NODE_ENV=production \
#     NEXT_TELEMETRY_DISABLED=1 \
#     PORT=3100 \
#     HOSTNAME=0.0.0.0

# # The standalone output already contains the server and only the modules it needs.
# COPY --from=build --chown=node:node /app/apps/admin/.next/standalone ./
# COPY --from=build --chown=node:node /app/apps/admin/.next/static ./apps/admin/.next/static
# COPY --from=build --chown=node:node /app/apps/admin/public ./apps/admin/public

# USER node
# EXPOSE 3100

# HEALTHCHECK --interval=15s --timeout=5s --start-period=25s --retries=5 \
#   CMD node -e "fetch('http://127.0.0.1:3100/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# ENTRYPOINT ["/usr/bin/dumb-init", "--"]
# CMD ["node", "apps/admin/server.js"]
