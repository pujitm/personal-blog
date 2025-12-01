---
layout: "../../layouts/SimpleBlogPost.astro"
title: "A better take-home interview"
description: "A reflection on the take-home exercise I created at Kachow."
pubDate: "Jul 20 2020"
# heroImage: "/placeholder-hero.jpg"
---

## Interviewing software development candidates is tough.

It _feels_ like you (as the interviewer) have to choose between spending a metric ton of time
evaluating candidates and wasting time on a sub-par hire.

It's almost a catch-22 (the tradeoffs among different interview strategies are adequately described in
[this Reddit comment](https://www.reddit.com/r/programming/comments/hrm3kw/tech_job_interviews_assess_performance_anxiety/fy58oe2?utm_source=share&utm_medium=web2x)).

Surely there's a way to reduce the time it takes to acknowledge a candidate as fit for the job--right?

I am biased towards take-home questions.
They allow me to evaluate candidates in an environment similar to their would-be work setting
(especially for remote positions).

Oh, and they would also grant me, personally,
a massive unfair advantage over fellow interview candidates: time.

---

## So, I tried to make a better take-home question.

About 2 weeks ago, I asked the 6 junior developers working under me to participate in a little experiment.
I gave them a vague prompt, some starter code, and asked them to make a program conforming to it.

You can find what I gave them in [this github repo](https://github.com/Be-Next-Tech/checkout-system-pricing-template).

In the meantime, I drafted a document to help me evaluate responses.
I wrote this before receiving or writing any code to reduce bias. Here's what I came up with:

### Program Criterion

| Criterion                                                                                                                                   |                                 Max Score                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------- | :-----------------------------------------------------------------------: |
| **Readability** <br> Can you read and understand the program in 5 minutes?                                                                  |                                     1                                     |
| Added tests                                                                                                                                 |                                     1                                     |
| Clarified scope and specs (asked clarifying questions)                                                                                      |                                     1                                     |
| Asked about decoupling pricing rules vs. checkout                                                                                           |                                     1                                     |
| Decoupled pricing rules and checkout                                                                                                        |                                     1                                     |
| Runtime cost/complexity (Not absurd)                                                                                                        |                                     1                                     |
| Can explain complexity                                                                                                                      |                                     1                                     |
| Used appropriate data structures                                                                                                            |                                     1                                     |
| \# of code smells \* severity                                                                                                               | Severity is 1 (least severe) - 5 (most severe), subtract from total score |
| Documentation is present and useful                                                                                                         |                                     2                                     |
| Commit messages & frequency are appropriate                                                                                                 |                                     2                                     |
| **Functionality** <br> Does it work?                                                                                                        |                                     1                                     |
| **Modularity** <br> Is it easy to identify different components of the program? Change them with minimal/no disruption to other components? |                                     2                                     |
| **Extendibility** <br> Is code reused appropriately? How easy is it to build on top of/add to?                                              |                                     2                                     |
| Can explain scope for improvement                                                                                                           |                                     1                                     |

### Interview Criterion

| Criterion                   | Max Score |
| --------------------------- | :-------: |
| Personable/good team player |     1     |

### Test Criterion

| Criterion                                   | Max Score |
| ------------------------------------------- | :-------: |
| Considered edge cases                       |     1     |
| Cases can be skimmed and understood quickly |     1     |

### Bonus Criterion

| Criterion                                                                       | Max Score |
| ------------------------------------------------------------------------------- | :-------: |
| Bonus for new test case                                                         |     1     |
| Documentation explains thought process (design), decision-making, and tradeoffs |     3     |
| Configures & Uses linter                                                        |     1     |
| Integrates linter in development process (either via CI or git hooks)           |     1     |
| Bonus for pointing out mistakes in specs or provided code/tests                 |     1     |

Then, my team asked me to write a submission as well [(link to repo)](https://github.com/Be-Next-Tech/checkout-system-pricing-pujitm/tree/a75ff38412d255d6aeee4d2a2dee424da4ec9ba5)\[1\].

> Side Note: I tried to use Github Classroom for the interview workflow.
> In hindsight, I should have made a separate organization specifically for these take-home questions.
> I think this flow has a lot of room for improvement.

---

That weekend, we convened to discuss and critique each other's code together.
This was brave of them, and I'm proud that they were willing to be so vulnerable to each other!

## I was surprised by the result.

For context, these developers were third-year undergraduate computer science students,
and 3 of the 6 attended top 15 computer science programs.
I expected the students from higher ranking programs to produce better programs.

This was not the case.

To my surprise, the submissions were mostly the same.
Of course, each of them had different strengths and weaknesses too.
Some organized and placed/scoped their logic more appropriately while others used better variable names and typings
(all of them chose to use Typescript). They spent between 30-60min on their code, and the average submission looked like:

```ts | checkout.ts
// checkout.ts
type SKU = string;
const itemsToPrice = {
  A: {
    unitPrice: 50,
    specialPrice: 130,
    specialQuantity: 3,
  },
  B: {
    unitPrice: 30,
    specialPrice: 45,
    specialQuantity: 2,
  },
  C: {
    unitPrice: 20,
  },
  D: {
    unitPrice: 15,
  },
};

/**
 * Interface that your checkout implementation should conform to
 */
export interface CheckoutInterface {
  add(...skus: SKU[]): unknown;
  total(): number;
}

export class Checkout implements CheckoutInterface {
  items: Map<string, number>; // maps item to its quantity
  totalPrice: number; // total price of items

  /**
   * Constructs a new checkout
   */
  constructor() {
    this.items = new Map();
    this.totalPrice = 0;
  }

  /**
   * Adds given items to the checkout and updates the total price
   * @param {SKU[]} skus - list of items to checkout
   */
  add(...skus: SKU[]) {
    // maps items to their quantities
    skus.forEach((item) => {
      if (!this.items.has(item)) {
        this.items.set(item, 0);
      }
      this.items.set(item, this.items.get(item) + 1);
    });

    // update total price based on quantity of each item
    this.items.forEach((quantity, item) => {
      if (itemsToPrice[item].specialPrice !== undefined) {
        // item has special offer
        this.totalPrice +=
          itemsToPrice[item].specialPrice *
          Math.floor(quantity / itemsToPrice[item].specialQuantity);
        this.totalPrice +=
          itemsToPrice[item].unitPrice * (quantity % itemsToPrice[item].specialQuantity);
      } else {
        // item is at unit price
        this.totalPrice += itemsToPrice[item].unitPrice * quantity;
      }
    });
  }

  /**
   * Returns total price of the items
   * @return {number} total price of items
   */
  total() {
    return this.totalPrice;
  }
}
```

```ts
// checkout.test.ts
import { CheckoutInterface, Checkout } from "./checkout";

function makeCheckout(): CheckoutInterface {
  return new Checkout();
}

describe("Checkout Pricing", () => {
  describe("Calculate Product Prices", () => {
    it("When given products that don't require a strategy, it computes an accurate total", () => {
      const checkout = makeCheckout();
      const expectedTotal = 115;

      checkout.add("A", "B", "C", "D");

      expect(checkout.total()).toEqual(expectedTotal);
    });

    it("When 2 Bs are added, it applies the correct discount", () => {
      const checkout = makeCheckout();
      const expectedTotal = 45;

      checkout.add("B", "B");

      expect(checkout.total()).toEqual(expectedTotal);
    });

    it("When 3 As are added, it applies the correct discount", () => {
      const checkout = makeCheckout();
      const expectedTotal = 130;

      checkout.add("A", "A", "A");

      expect(checkout.total()).toEqual(expectedTotal);
    });

    it("When a non-multiple of the special quantity for A is added, it applies the correct discount", () => {
      const checkout = makeCheckout();
      const expectedTotal = 180;

      checkout.add("A", "A", "A", "A");

      expect(checkout.total()).toEqual(expectedTotal);
    });

    it("When a multiple of the special quantity for A is added, it applies the correct discount", () => {
      const checkout = makeCheckout();
      const expectedTotal = 260;

      checkout.add("A", "A", "A", "A", "A", "A");

      expect(checkout.total()).toEqual(expectedTotal);
    });

    it("When a special quantity of B is added non-consecutively, it applies the correct discount", () => {
      const checkout = makeCheckout();
      const expectedTotal = 95;

      checkout.add("B", "A", "B");

      expect(checkout.total()).toEqual(expectedTotal);
    });
  });
});
```

> This exercise helped me recalibrate our one-on-ones. I realized I was being too abstract and open-ended when coaching them.
> Going forward, I plan to provide controlled exercises (instead of unstructured, open-ended ones) to help them to use new concepts practically.

---

## My submission was (very) different.

[My implementation](https://github.com/Be-Next-Tech/checkout-system-pricing-pujitm/tree/a75ff38412d255d6aeee4d2a2dee424da4ec9ba5) didn't look similar to the rest of my team's, and I also took more time than them: the code + tests took about 2.5 hours to write. I thought it might be insightful to explore the differences, but first, here are some excerpts from the code.

Product & Cart representation:

```ts
// src/product.ts
/** Stock keeping unit. Type alias for string. Intended to clarify what the string should reference when composing other types */
export type SKU = string;

export interface HasSku {
  sku: SKU;
}

export interface Product extends HasSku {
  price: number;
}

// src/cart.ts
export interface ItemInCart {
  product: Product;
  quantity: number;
  /**
   * Amount to charge for this item
   *
   * Intended to support charge for an amount differing from the normal subtotal
   */
  amountToCharge: number;
}

export type Cart = Map<SKU, ItemInCart>;
```

How pricing is handled:

```ts
// src/pricing.ts
import { ItemInCart, Cart } from "./cart";
import { SKU } from "./product";

export interface PricingDependencies {
  item: ItemInCart;
  sku: SKU;
  cart: Cart;
}

/** May return a subtotal price to charge a customer */
export type PriceOption = (dependencies: PricingDependencies) => number | void;

/** Returns a `PriceChooser` that can select from the given `PriceOption`s  */
export type PricingStrategyFactory = (options: PriceOption[]) => PriceChooser;

/** Returns the subtotal price to charge a customer */
export type PriceChooser = (dependencies: PricingDependencies) => number;

// Strategy Factories

/**
 * Choose the lowest possible price
 * @param possiblePrices
 */
const Minima: PricingStrategyFactory = (possiblePrices) => (props) => {
  const defaultPrice = props.item.product.price * props.item.quantity;
  const prices = [defaultPrice, ...possiblePrices.map((strategy) => strategy(props))];
  return Math.min(...removeInvalidPrices(prices));
};

// Helpers

function removeInvalidPrices(prices: (number | void)[]): number[] {
  function isNumber(val): val is number {
    return val !== undefined && val !== null && Number(val) !== NaN;
  }
  return prices.filter(isNumber);
}
```

Examples of how discounts are handled:

```ts
// src/promotions/templates/sku.ts
import { PriceOption } from "pricing";

interface PromotionParams {
  /** SKUs the `discount` will apply to */
  skus: string[];
  /** A discounting strategy */
  discount: PriceOption;
}

/**
 * An Sku Promotion solely relies on (one or more) SKUs to apply a discount
 */
export function MakeSkuPromotion({ skus, discount }: PromotionParams): PriceOption {
  return (params) => {
    if (skus.includes(params.item.product.sku)) return discount(params);
  };
}

// ------ src/promotions/templates/discounts/bulk.ts ------
interface DiscountParams {
  triggerQuantity: number;
  newUnitPrice: number;
}

/**
 * A bulk discount is a unit-level discount that is triggered when a minimum quantity
 * `triggerQuantity` (inclusive) is purchased. The item's unit price is then discounted to the `newUnitPrice`
 */
export function MakeBulkDiscount(params: DiscountParams): PriceOption {
  return ({ item }) => {
    if (item.quantity >= params.triggerQuantity) return item.quantity * params.newUnitPrice;
  };
}
```

Checkout Implementation:

```ts
// src/checkout.ts
class CheckoutItem implements ItemInCart {
  amountToCharge: number;
  constructor(readonly product: Product, public quantity = 1) {
    this.amountToCharge = this.subtotal();
  }

  /** Shortcut to multiply product's regular unit price by the quantity */
  private subtotal(): number {
    return this.quantity * this.product.price;
  }
}

export class Checkout implements CheckoutInterface {
  private cart: Cart = new Map<SKU, ItemInCart>();
  constructor(private runPricingStrategy: PriceChooser) {}

  add(...items: Product[]): void {
    items.forEach((item) => this.addItem(item));
  }

  total(): number {
    let subtotal = 0;
    this.cart.forEach((item) => (subtotal += item.amountToCharge));
    return subtotal;
  }

  private addItem(item: Product) {
    const cart = this.cart;

    if (cart.has(item.sku)) {
      cart.get(item.sku).quantity++;
    } else {
      cart.set(item.sku, new CheckoutItem(item));
    }

    this.onItemAdded();
  }

  private onItemAdded() {
    this.refreshAllItemPrices();
  }

  private refreshAllItemPrices() {
    return this.cart.forEach((item, sku, cart) => {
      item.amountToCharge = this.runPricingStrategy({ item, sku, cart });
    });
  }
}
```

This isn't supposed to be a put-down for my team or an ego-booster for myself (this was obviously written with their permission).
The point is to use the differences in our submissions to illustrate:

1. Why the "junior" code might be detrimental to a project in the long-term
2. How most of those issues are addressed in the "senior" code (i.e. my code)
3. The usefulness and validity of this litmus test

### Context: A Production Checkout System

While writing this reflection, I looked for a clear, production-backed example in this domain to demonstrate the difference between entry-level and experienced candidates.

I found some [documentation for GloriaFood](https://www.gloriafood.com/restaurant-ideas/restaurant-promotion-ideas-to-try) (an online ordering platform) insightful for this purpose. Here are several promotion structures they support:

> Note: this is verbatim.

| <div style="text-align:center">**Promotions**</div>                                                                                                         |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Buy one, get one free.** <br> e.g. Buy a burger and get the second one free or buy a large pizza and get the soda free                                    |
| **% discount on selected items** <br> e.g. 30% off on any dessert or drink                                                                                  |
| **Fixed discount amount on cart** <br> e.g. $5 discount for every order above $30                                                                           |
| **% discount on cart** <br> e.g. 10% discount for every order above \$30                                                                                    |
| **Free delivery** <br> e.g. Free delivery for orders above \$15                                                                                             |
| **Payment method reward** <br> e.g. 5% discount for every order paid online                                                                                 |
| **Buy 2,3,… get one free** <br> e.g. Buy a burger and fries and get the drink for free or buy a soup plus main dish plus salad and get the dessert for free |
| **Fixed discount amount on combo deal** <br> e.g. \$5 off for every main dish plus dessert                                                                  |
| **% discount on combo deal** <br> e.g. Buy a burger plus fries and get 20% of the drink                                                                     |
| **Free dish or discounted item as part of a meal** <br> e.g. Free dessert or drink if you purchase starter plus main dish                                   |
| **Value Meal bundle** <br> e.g. Any 2 appetizers plus 2 main dishes + 2 desserts → all for \$55.                                                            |
| **Happy hour** <br> Promotion is only active during certain days and time intervals.                                                                        |
| **Delivery Area** <br> Limit promotion by geographic location                                                                                               |
| **Cart value** <br> Offer discounts depending on the order value if you feel your delivery orders are too petty.                                            |
| **Payment Method** <br> e.g. Cash vs Card                                                                                                                   |
| **Client Type** <br> e.g. Set a promotion only for new clients or only for returning ones.                                                                  |
| **Usage Limit** <br> e.g. How many times a promotion can be used by your customer (or in total).                                                            |
| **Exclusivity** <br> e.g. Can't be combined with other promotions in the same order                                                                         |
| **Expiration Date** <br> Will automatically expire on your desired date                                                                                     |

Recognizing all of these explicit possibilities is difficult during the short time a candidate would have to write their solution,
unless they've already made something extremely similar.

If a candidate had no prior experience making such a system, yet was still able to identify all of these possibilities (before I publicized them),
I would be quite impressed!

### Production vs. "Junior" Code

Putting the buggy code aside, implementing these promotions using the junior developer's program and structure would get messy quickly.
Especially if those settings could be user-configurable.

Here, the checkout system and the pricing rules are tightly coupled.
This means that each change to a pricing rule requires a change to the checkout module.

```ts
// at some point in the checkout module
if (itemsToPrice[item].specialPrice !== undefined) {
  if (insert_subcondition_if_else_tree_here()) {
    ...
  }
} else if (insert_giant_nested_if_else_tree_here()) {
  ...
} else {
  this.totalPrice += itemsToPrice[item].unitPrice * quantity;
}
```

This structure would likely generate a lot of duplicate code as well.

Imagine a scenario where multiple changes related to the checkout system must be made simultaneously--say some analytics, tax calculations, and inventory integrations.

If this same program structure were to be used,
many different developers across different teams could be working on the same file,
and perhaps even on the same function.

To avoid creating such a massive, unmanageable file, more entities, likely with a global scope like like `itemsToPrice`, would be created.

Each team would optimize for different requirements and refactor accordingly,
which would likely introduce unexpected changes for all other teams, especially if shared resources are modified.

Tests would break all the time, so the weary, overwhelmed teams would begin neglecting them, introducing more bugs,
which would require more changes that would perpetuate the cycle.

Not to mention, merges and integration would be very _exciting_ times for the team.

Take all of this, increase the logical/rule complexity and feature requirements by a few orders of magnitude,
and we're left with (what I imagine is) the reason why COBOL-based infrastructure code is a nightmare \[4\].

> Tightly coupled systems tend to exhibit the following developmental characteristics, which are often seen as disadvantages:
>
> 1. A change in one module usually forces a ripple effect of changes in other modules.
> 2. Assembly of modules might require more effort and/or time due to the increased inter-module dependency.
> 3. A particular module might be harder to reuse and/or test because dependent modules must be included.

This more "literal" structure yields software that is:

1. Difficult to test
2. Difficult to change (without breaking existing functionality)
3. Highly "resistant" to evolving business needs

### Production vs. "Senior" code

On the other hand, each of these promotions could be implemented in the "senior" code by

1. Composing the existing pricing format (`PriceOption` and `PriceChooser`) in a module under `promotions/templates` [2].
2. (Optionally) Implementing each promotion in a module under `promotions`, or within a database record.
3. Adding data (customer info, location) that is exposed to the pricing options via `runPricingStrategy` in the checkout module.

This isn't to say that the senior code is perfect.
For starters, this approach results in (a lot) more code, which can make it difficult for project newcomers to onboard and
use the composition structure quickly.

However, the benefits are worth those tradeoffs. Adding a new promotion is as easy as making a new file under `promotions`:

```ts
// promotions/2for45.ts

import { MakeGroupDiscount } from "./templates/discounts/group";
import { MakeSkuPromotion } from "./templates/sku";

// Groups of 2 product B's will be sold for 45
// Leftover quantity of units will be sold at normal unit price

const APPLICABLE_SKUS = ["B"];

const UNITS_IN_GROUP = 2;
const GROUP_PRICE = 45;

export default MakeSkuPromotion({
  skus: APPLICABLE_SKUS,
  discount: MakeGroupDiscount({ quantity: UNITS_IN_GROUP, price: GROUP_PRICE }),
});

// hypothetical use - just add the new promotion to a list
import TwoBsFor45 from "promotions/2for45";
const priceChooser = MakePricingStrategy.Minima([...discountsAndFees, TwoBsFor45]);
new Checkout(priceChooser);
```

In retrospect the variable naming could be better.
In this context, `APPLICABLE_SKUS` could be understood as the skus that make up the "group" for the group discount,
but they are actually triggers--the discount logic will only run if a product sku matches an element in `APPLICABLE_SKUS`.

Even so, this implementation attempts to break down each layer of logic into separate, testable units.
This makes unit testing easy and almost natural, enabling Test Driven Development. Debugging cycles should get shorter, and
it will be quicker to make robust changes to business logic.

For instance, to add analytics, simply add an analytics plugin to a hook:

```ts
// checkout.ts

private onItemAdded() {
    this.refreshAllItemPrices();
    // Analytics, callback, etc.
}
```

Something like Delivery or Tax could be implemented by changing the checkout interface,
but they also could be treated as just another `Product`, with `PriceOption` functions to calculate their values at runtime.
For instance:

```ts
// checkout.ts

// import `MakePricingStrategy`, but reference it as `PricingStrategies`
import { MakePricingStrategy: PricingStrategies } from './pricing';

...

constructor(config: CheckoutConfig) {
  // for demonstration purposes. PricingStrategies.Minima chooses the lowest possible price for an item.
  // calculate.delivery and calculate.tax would be PriceOption's, the same as any discount or pricing calculation.
  // They would only apply to their respective items/"sku" identifiers.
  // > type PriceOption = (dependencies: PricingDependencies) => number | void;

  const { calculate } = config;
  this.runPricingStrategy = PricingStrategies.Minima([calculate.delivery, calculate.tax, ...calculate.productDiscounts]);
  this.add(config.delivery, config.tax);
}
```

This system has its drawbacks. The list-based strategy doesn't scale very well into the millions and tens of millions of list items:

<!-- <iframe height="400px" width="100%" src="https://repl.it/@pujitm/BothCapitalProperty?lite=true" scrolling="no" frameborder="no" allowtransparency="true" allowfullscreen="true" sandbox="allow-forms allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-modals"></iframe> -->

Actually, my first instinct was to use a Map-based structure (which would scale well),
but my very next thought was that an item's sku or id couldn't be the only trigger for a price change.

Triggers could include the number of items in-cart, other items in-cart, date, location, customer info, inventory levels, output from another program, and so on.

We could hash all of this information into a key, and then parse that (kind of like an extension of Instagram's ID sharding) \[3\],
but:

1. This introduces quite a complex layer to the application
2. I'm not convinced that this optimization is necessary.

The odds of an individual store (think a retail Walmart location or a single Amazon merchant) having millions of active promotions is practically 0.
So one way we could scale is by reducing the scope of what the overall pricing strategy handles.

This way each product's store would be responsible for setting its prices, and in Amazon's case, only strategies from stores being purchased from would be run. Seems more reasonable.

Of course, this can be taken further. The composability of pricing strategies means that we can optimize sku-triggered discounts into a map, while
using any data or program structure for other types of triggers (even the hash-based one if we deemed it necessary).
This would drastically speed up the online checkout process if purchasing from multiple merchants with supermarket-level of skus.

Basically, we can add any number optimizations and layers and still keep the same program structure, making minimal changes.

This is highly desirable because it will decrease costs, increase momentum and morale, and encourage testable and robust code.

I introduced 3 different magnitudes of scale--single store, multi-store, and e-commerce--that this same program can handle without many changes to the checkout or pricing modules.
This would be nigh impossible with the junior's code.

Now, was I thinking about all of this when I wrote the code?

No. I just saw the "shape" of the problem:

- There can be multiple different possible prices for an item (e.g $5, $7)
- There are many different ways to decide a possible price (e.g. Bulk discount, % discount)
- There are multiple factors that influence a possible price (e.g. product, other products in cart, customer, date/time)
- There are different ways to choose which of the possible prices to charge (e.g. Max profit, lowest price, curved for sales/inventory quota/ratios)

Based on the number of uncertainties and variable factors, as well as the limited time I had to deliver the program,
this program structure seemed appropriate, but in retrospect, there's a lot of room to improve. The code and state handling seems bug-prone, for instance.

> If you're _relatively_ new to software development, don't just copy architectures, patterns, and development techniques you read about.
> Understand what they are trying to solve, discover their drawbacks, and reflect on whether (and when) the tradeoffs are worth it.

---

## So, does this take-home solve biased selection concerns?

> [A Take-home is] Great in theory for the anxiety part but excludes everyone who has commitments outside normal work hours
> and then biases based on who has more free time to solve the problem.

This experience leads me to conclude that take-homes will only favor those with more time _if_ the compared candidates are at a similar skill and experience level.

**However,** I don't find that concern applicable to in this case.

1. This take-home requires little to no preparation
2. It _can_ be completed both well and quickly (under 2 hours)
3. It is _easier_ to demonstrate superior ability vs. a traditional interview

Considering the time spent on preparation for traditional technical interviews, this take-home is not time-intensive.

> You should ask for it to be submitted within a short period (a few hours to < 1 day, ideally).
> It's unreasonable to assign a problem that will take more time.
>
> Expectations/Criteria should be clear. Don't burden candidates with guesswork.

Honestly, I don't have enough experience or information to tell whether these guidelines alleviate selection bias.

But the benefits outweigh the drawbacks (for me):

- Less time-intensive for interviewer
- More flexible for candidates
- More data points for evaluation

So it is my new strategy. For now.

## Footnotes and References

I'll probably revise this article later.

[1]: Link to the repo at the time of evaluation. There may be future changes.

[2]: In Javascript, a "module" is usually a file with exported code. A folder with an `index` module is also a module.
e.g. `checkout.ts` and `checkout/index.ts` would both yield the module `checkout`.

[Digital Ocean, Public Interfaces to JS Modules](https://www.digitalocean.com/community/tutorials/react-index-js-public-interfaces)

[Freecodecamp, Es6 Modules](https://www.freecodecamp.org/news/how-to-use-es6-modules-and-why-theyre-important-a9b20b480773/)

\[3\]: [Instagram's id sharding](https://instagram-engineering.com/sharding-ids-at-instagram-1cf5a71e5a5c)

[4]: Some extra reading about coupling:

- [Stack Overflow, Coupling](https://softwareengineering.stackexchange.com/a/334678)
- [Wikipedia, Coupling](<https://en.wikipedia.org/wiki/Coupling_(computer_programming)>)
