---
title: "LandHacker: from parcel to offer in one screen"
excerpt: "Land buyers lose days on one question: what should we offer? LandHacker maps the parcel, prices it from comparable sales, writes two offers, and answers the team's repeat questions without pinging anyone."
category: "Solutions"
date: 2026-10-10
author: "Sondri"
draft: true
---

A land acquisition team does the same five things over and over. Find a parcel. Judge it. Price it. Make an offer. Hand it to whoever closes. Most teams run those steps across a parcel app, a spreadsheet, a pricing gut feeling and a group chat that never goes quiet.

LandHacker is the platform we built to do all five in one place. This post covers what it does and the decisions behind it.

## The problem

Three things slow a land team down, and none of them is a lack of leads.

**Pricing is the bottleneck.** Deciding what to offer is the hardest step for new and experienced buyers alike. New people can't act until a senior person weighs in, so every deal waits in the same queue.

**Slow maps kill research.** Buyers scroll a map all day. At state scale that map has to draw tens of millions of parcel boundaries. If it stutters, people go back to the commercial app they already pay for.

**The same questions get asked all day.** Teams work different hours. Someone asks about a parcel's survey or last offer, everyone gets a notification, and the answer was already in the thread from yesterday.

## What we built

### A map that keeps up

The map is the home screen. It opens on satellite imagery and stays smooth while you pan and zoom, because parcel shapes are served as vector tiles. That's the same approach the fast commercial parcel apps use.

- Parcel outlines appear on their own as you zoom in.
- Search by address (typed or spoken), by dropped pin, or by parcel ID.
- Overlays for flood zones, contour lines, structures and lot dimensions. Each one toggles on and off.
- Draw any shape on the map and get live stats for the parcels inside it.
- Measure a lot, or the distance between two parcels.
- Colour-coded pins for priority, and notes the whole team can see, stamped with who wrote them and when.

### Where to look first

Before anyone opens a parcel, LandHacker ranks counties by opportunity and suggests where to start. Inside a county, a heat map sorts areas into three bands:

| Band | What it means |
|---|---|
| Blue ocean | Good land value, little competition. Look here first. |
| Grey ocean | Mixed. Worth a look with the overlays on. |
| Red ocean | Low land value, or lots shaped in ways buyers avoid. |

The thresholds behind each band are settings the business owns. They aren't hard-coded.

### A price you can check

Select a parcel and LandHacker estimates its value. It starts from the assessed tax value and blends in comparable listings nearby. Comparables are weighted by how close they are and which direction they sit from the subject parcel. It also finds the nearest look-alike parcel, one with the same specs, as a second reference point.

The estimate always comes with its working: the inputs, the comparables, and their weights. A buyer can override it, but has to give a reason. Every valuation is saved to the property record with a timestamp and the model version, so you can look back at why a number was what it was.

### Two offers from one price

LandHacker turns the estimate into two ready offers:

1. **Cash**, at a set percentage of the estimated value.
2. **Seller-finance**, at a higher price with a small down payment and no interest.

Both sit side by side so the buyer can compare them. The percentages and terms are settings, so the business can change them without a code release.

No offer goes out until a person checks it and signs off. Every draft, edit, approval and send is logged.

### Handoff and a simple pipeline

Once a parcel is vetted, the researcher passes it to a named salesperson. Each property has one record with everything on it: parcel details, overlays, valuation history, offers, tags and notes. Statuses move it through a basic pipeline. We kept this small on purpose. It isn't trying to replace a full CRM.

### A team chat that stays quiet

The chat remembers what's been asked and answered, and it can read the deal data: surveys, prices, addresses, past offers. When a question has been answered before, it replies to the person who asked and **nobody else gets a notification**.

If it isn't confident, it sends the question to the team the normal way. Answers point to the record or message they came from, and when someone corrects an answer, the chat remembers the correction. Salespeople can also look up offers, ask for a suggested offer and approve offers from the chat.

## The decisions behind it

**Speed was a requirement from day one.** The map had to match the fast commercial apps before we built anything on top of it. We tested rendering at state-scale parcel counts first.

**A person approves every offer.** LandHacker does the math and drafts the paperwork. A buyer still reviews and signs off on every offer before it goes out.

**Business rules are settings.** Offer percentages, finance terms and heat map thresholds change as the market changes. The business can edit them without waiting on a developer.

**Every number shows its working.** Each valuation shows its inputs, carries an audit trail and can be overridden with a reason. Buyers trust a number when they can see where it came from.

**The client owns the accounts.** Parcel data, AI and skip-tracing services run on the client's own subscriptions and keys. If they ever part ways with us, the platform keeps running.

## Where this fits

The pattern goes beyond land. Any team that researches, prices and makes offers has the same three problems: one scarce expert, slow tools and a noisy chat thread. If that sounds like your team, book a discovery call and we'll tell you whether we can help.
