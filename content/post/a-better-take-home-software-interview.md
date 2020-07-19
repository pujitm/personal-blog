+++
authors = []
date = ""
draft = true
excerpt = ""
hero = ""
timeToRead = 0
title = "A better take-home software interview"

+++

Interviewing software development candidates is tough.

It _feels_ like you (as the interviewer) have to choose between spending a metric ton of time
evaluating candidates and wasting time on a sub-par hire.

It's almost a catch-22 (the tradeoffs among different interview strategies are adequately described in
[this Reddit comment](https://www.reddit.com/r/programming/comments/hrm3kw/tech_job_interviews_assess_performance_anxiety/fy58oe2?utm_source=share&utm_medium=web2x)).

Surely there's a way to reduce the time it takes to acknowledge a candidate as fit for the job--right?

I am biased towards take-home questions.
They allow me to evaluate candidates in an environment similar to their would-be work setting
(especially for remote positions).

Oh, and they would also grant me, personally,
a massive unfair advantage over fellow interview candidates--time.

---

So, I tried to make a better take-home question.

About 2 weeks ago, I asked the 6 junior developers working under me to participate in a little experiment.
I gave them a vague prompt, some starter code, and asked them to make a program conforming to it.

You can find everything I gave to them on my blah-blah-blah repo (link).

In the meantime, I drafted a document to help me evaluate responses.
I wrote this before receiving or writing any code to reduce bias. Here's what I came up with:

```ts
console.log('hi);
```

Then, as per the developers' wishes, I also wrote my submission (link to github, with commit sha).

> Side Note: I tried to use Github Classroom for the interview workflow.
> In hindsight, I should have made a separate organization specifically for these take-home questions.
> I think this flow has a lot of room for improvement.

---

That weekend, we convened to discuss and critique each other's code together.
This was brave of them, and I'm proud that they were willing to be so vulnerable to each other!

I was a bit shocked by what I found.

For context, these developers were third-year undergraduate computer science students,
and 3 of the 6 attended top 15 computer science programs.
I expected the students from higher ranking programs to produce better programs.

This was not the case.

To my surprise, the submissions were by and large the same.
Of course, each of them had different strengths and weaknesses that shone through.
Some organized and placed/scoped their logic more appropriately while others used better variable names and typings
(all of them chose to use Typescript). The average submission looked like:

```ts | checkout.ts
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
          itemsToPrice[item].unitPrice *
          (quantity % itemsToPrice[item].specialQuantity);
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

The developers' spent an average of 30-60min to produce this.

> Honestly, I felt a bit disheartened when I first saw this.
> I felt like an ineffective mentor/teacher because I failed
> to teach them to think and structure their code more readably and "configurably".
>
> Going forward, I plan to provide controlled exercises going allowing them to use new concepts practically.

---

Nonetheless, this take-home is an acceptable litmus test to gauge a candidate's technical ability and experience.

Please note that I don't intend this as a put-down for my team or an ego-booster for myself.
I hope to simply use the differences in our submissions to illustrate

1. Why the junior developers' code will likely be detrimental to a project in the long-term
2. How most of those issues are addressed in the senior developer's code (my code)
3. The usefulness and validity of this litmus test

While writing this, I found myself looking for a clear, production-backed example to demonstrate the difference between entry-level and experienced candidates.

I found some [documentation for GloriaFood](https://www.gloriafood.com/restaurant-ideas/restaurant-promotion-ideas-to-try) (an online ordering platform) insightful for this purpose. Here are several promotion structures they support:

> punctuation, capitalization, grammar plz

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

Recognizing all of these explicit possibilities is nigh impossible during the short time a candidate would have to write their solution,
unless they've already made something extremely similar.

Implementing these in promotions using the junior developers' program and structure would get messy quickly.
Especially if those settings could be user-configurable.

On the other hand, each of these promotions could be implemented by

1. Composing the existing pricing format (`PriceOption` and `PriceChooser`) in the senior developer's code
2. Adding data (customer info, location) that is exposed to the pricing options via `runPricingStrategy` in the checkout module.
